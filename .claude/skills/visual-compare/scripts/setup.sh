#!/usr/bin/env bash
# visual-compare setup: build two git refs of the site and serve them on
# separate ports against the shared local Supabase.
#
# Usage: setup.sh <base-ref> <head-ref> [label]
#
# Produces:
#   <repo>/visual-compare/<label>/           run dir (meta.json, server logs/pids)
#   <repo>/visual-compare/<label>/compare/   capture output dir (empty, for the spec)
#   ../gla_react-vc-base, ../gla_react-vc-head   worktrees (reused across runs)
#   frontend/playwright/visual-compare.spec.ts   copy of the capture spec
#
# Idempotent/cached: worktrees are reused (re-detached to the requested hash),
# npm ci is skipped when package-lock.json is unchanged, next build is skipped
# when .next was already built for the same commit.
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPTS/../../../.." && pwd)"

BASE_REF="${1:?usage: setup.sh <base-ref> <head-ref> [label]}"
HEAD_REF="${2:?usage: setup.sh <base-ref> <head-ref> [label]}"

BASE_HASH=$(git -C "$REPO" rev-parse --verify "$BASE_REF^{commit}")
HEAD_HASH=$(git -C "$REPO" rev-parse --verify "$HEAD_REF^{commit}")
BASE_SHORT=$(git -C "$REPO" rev-parse --short "$BASE_HASH")
HEAD_SHORT=$(git -C "$REPO" rev-parse --short "$HEAD_HASH")

LABEL="${3:-${BASE_SHORT}_vs_${HEAD_SHORT}}"
RUN_DIR="$REPO/visual-compare/$LABEL"
BASE_PORT="${VC_BASE_PORT:-3001}"
HEAD_PORT="${VC_HEAD_PORT:-3002}"

echo "== visual-compare setup =="
echo "base: $BASE_REF ($BASE_HASH) -> port $BASE_PORT"
echo "head: $HEAD_REF ($HEAD_HASH) -> port $HEAD_PORT"
echo "run dir: $RUN_DIR"

# ── Preflight: env + Supabase ───────────────────────────────────────────────
if [ ! -f "$REPO/frontend/.env.local" ]; then
  echo "ERROR: frontend/.env.local missing (copy from .env.local.sample; keys from 'npx supabase start')" >&2
  exit 1
fi

SUPA_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$REPO/frontend/.env.local" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')
if [ -z "$SUPA_URL" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL not set in frontend/.env.local" >&2
  exit 1
fi

# After a reboot the db container can sit in "Created" — start it.
if command -v docker >/dev/null 2>&1; then
  for c in $(docker ps -a --filter 'name=supabase' --filter 'status=created' --filter 'status=exited' --format '{{.Names}}' 2>/dev/null || true); do
    echo "starting stopped container: $c"
    docker start "$c" >/dev/null || true
  done
fi

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$SUPA_URL/rest/v1/" || true)
if [ "$code" = "000" ]; then
  echo "ERROR: Supabase not reachable at $SUPA_URL — run 'npx supabase start' at the repo root (requires Docker), then re-run." >&2
  exit 1
fi
echo "supabase ok at $SUPA_URL (http $code)"

# ── Run dir + meta ──────────────────────────────────────────────────────────
mkdir -p "$RUN_DIR/compare"
cat > "$RUN_DIR/meta.json" <<EOF
{
  "baseRef": "$BASE_REF",
  "baseHash": "$BASE_HASH",
  "headRef": "$HEAD_REF",
  "headHash": "$HEAD_HASH",
  "basePort": $BASE_PORT,
  "headPort": $HEAD_PORT,
  "createdAt": "$(date -Iseconds)"
}
EOF

# ── Diff-script deps (pixelmatch/pngjs live beside this script) ─────────────
if [ ! -d "$SCRIPTS/node_modules" ]; then
  (cd "$SCRIPTS" && npm install --no-audit --no-fund)
fi

# ── Worktrees: checkout, install, build ─────────────────────────────────────
prepare_side() {
  local side=$1 hash=$2
  local wt="$REPO/../gla_react-vc-$side"
  if [ -e "$wt/.git" ]; then
    echo "[$side] reusing worktree $wt -> $hash"
    git -C "$wt" checkout --detach "$hash"
  else
    echo "[$side] creating worktree $wt -> $hash"
    git -C "$REPO" worktree add --detach "$wt" "$hash"
  fi

  cp "$REPO/frontend/.env.local" "$wt/frontend/.env.local"
  if [ -f "$REPO/frontend/.env.test" ]; then
    cp "$REPO/frontend/.env.test" "$wt/frontend/.env.test"
  fi

  local lockhash stamp="$wt/frontend/node_modules/.vc-lock-hash"
  lockhash=$(sha1sum "$wt/frontend/package-lock.json" | cut -d' ' -f1)
  if [ ! -d "$wt/frontend/node_modules" ] || [ "$(cat "$stamp" 2>/dev/null || true)" != "$lockhash" ]; then
    echo "[$side] npm ci..."
    (cd "$wt/frontend" && npm ci --no-audit --no-fund)
    echo "$lockhash" > "$stamp"
  else
    echo "[$side] node_modules up to date"
  fi

  local buildstamp="$wt/frontend/.next/.vc-build-hash"
  if [ "$(cat "$buildstamp" 2>/dev/null || true)" != "$hash" ]; then
    echo "[$side] next build ($hash)..."
    (cd "$wt/frontend" && npm run build)
    echo "$hash" > "$buildstamp"
  else
    echo "[$side] build already current"
  fi
}

prepare_side base "$BASE_HASH"
prepare_side head "$HEAD_HASH"

# ── Start servers ───────────────────────────────────────────────────────────
free_port() {
  local port=$1
  local pids
  pids=$(lsof -t -i ":$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "killing stale process(es) on port $port: $pids"
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

start_side() {
  local side=$1 port=$2
  local wt="$REPO/../gla_react-vc-$side"
  free_port "$port"
  (cd "$wt/frontend" && nohup npx next start -p "$port" > "$RUN_DIR/$side-server.log" 2>&1 & echo $! > "$RUN_DIR/$side-server.pid")
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$port/" || true)
    if [ "$code" != "000" ]; then
      echo "[$side] server ready on :$port (http $code, pid $(cat "$RUN_DIR/$side-server.pid"))"
      return 0
    fi
    sleep 1
  done
  echo "ERROR: [$side] server on :$port did not come up; see $RUN_DIR/$side-server.log" >&2
  exit 1
}

start_side base "$BASE_PORT"
start_side head "$HEAD_PORT"

# ── Install the capture spec into the main working tree ─────────────────────
cp "$SCRIPTS/capture.spec.ts" "$REPO/frontend/playwright/visual-compare.spec.ts"
echo "capture spec copied to frontend/playwright/visual-compare.spec.ts"

echo
echo "== setup complete =="
echo "Next step (run from $REPO/frontend, in the background; takes 10-25 min):"
echo "  VC_OUT=$RUN_DIR/compare VC_BASE_URL=http://localhost:$BASE_PORT VC_HEAD_URL=http://localhost:$HEAD_PORT \\"
echo "    npx playwright test playwright/visual-compare.spec.ts --project firefox --reporter=line --workers=5 --retries=0"
echo "Then:"
echo "  node $SCRIPTS/compare.js $RUN_DIR"

#!/usr/bin/env bash
# visual-compare teardown: stop the two servers; optionally remove worktrees.
#
# Usage: teardown.sh <run-dir> [--remove-worktrees]
#
# Keep the worktrees by default — they cache node_modules and .next builds,
# which makes repeat comparisons much faster.
set -euo pipefail

SCRIPTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPTS/../../../.." && pwd)"

RUN_DIR="${1:?usage: teardown.sh <run-dir> [--remove-worktrees]}"

for side in base head; do
  pidfile="$RUN_DIR/$side-server.pid"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      # next start spawns children; kill the process group if possible
      kill "$pid" 2>/dev/null || true
      echo "[$side] killed server pid $pid"
    else
      echo "[$side] server pid $pid already gone"
    fi
    rm -f "$pidfile"
  fi
done

# Belt and braces: free the recorded ports.
if [ -f "$RUN_DIR/meta.json" ]; then
  for port in $(node -e "const m=require('$RUN_DIR/meta.json');console.log(m.basePort,m.headPort)" 2>/dev/null || echo ""); do
    pids=$(lsof -t -i ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill $pids 2>/dev/null || true
      echo "freed port $port (pids: $pids)"
    fi
  done
fi

if [ "${2:-}" = "--remove-worktrees" ]; then
  for side in base head; do
    wt="$REPO/../gla_react-vc-$side"
    if [ -e "$wt/.git" ]; then
      git -C "$REPO" worktree remove --force "$wt"
      echo "removed worktree $wt"
    fi
  done
fi

rm -f "$REPO/frontend/playwright/visual-compare.spec.ts"
echo "teardown complete"

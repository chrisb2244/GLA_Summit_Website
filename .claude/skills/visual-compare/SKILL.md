---
name: visual-compare
description: Full rendered visual/style comparison of two git refs of this site. Builds both refs, serves them against the shared local Supabase, captures every page (computed styles, geometry, hover/focus, screenshots) in Firefox, diffs them, and writes an annotated FINDINGS.md with before/after crops. Use when asked to visually compare two branches/commits or check for visual regressions between versions.
argument-hint: <base-ref> <head-ref> [label]
---

# Visual comparison of two site versions

Compare the **rendered output** of two git refs (commits or branch heads) of this
site and produce `FINDINGS.md` — an annotated, evidence-backed change list with
before/after image crops. "base" is the reference version (e.g. `origin/master`),
"head" is the version under review.

All heavy lifting is scripted. Your job is: run the scripts in order, then do the
**analysis** (classify diffs, attribute them to commits, write FINDINGS.md).

## Ground rules (do not skip)

- **Never compare dev servers.** `next dev` serves stale `'use cache'` RSC
  payloads from old edit states. The scripts build and run production servers;
  don't substitute your own.
- **Classify from data, not images.** Diagnose every finding from `report.md`
  (computed styles, rects, probe diffs) and the source/commits. Screenshot crops
  are *illustrations* attached afterwards. Image previews you read are
  downscaled — small text aliases (sans-serif can look serif) and spacing cannot
  be judged from them. Never state a visual conclusion based only on looking at
  a PNG.
- **Token budget:** never read `report.json` (hundreds of KB) or full-page PNGs
  in `compare/`. Read `report.md` (~35 KB). Open at most a handful of
  `compare/<slug>.diff.png` images, and only when `report.md` leaves a diff
  unexplained. Query `report.json`/capture JSONs with `node -e` one-liners when
  you need a specific value.
- The capture spec **must keep** its `settle()` logic (eager-loads lazy images,
  bounded 6 s wait — otherwise below-fold images hang the run), its
  redirect-retry in `captureOne` (/ticket client-redirects mid-capture), and
  `--retries=0` (a hang would re-run a 20-minute test).

## Step 1 — Setup (one command)

Resolve the user's two refs (`git rev-parse` accepts branches, tags, hashes).
Then run **in the background** (worktree creation + 2× `npm ci` + 2× `next build`
can take 5-10 min cold; ~1 min when cached from a previous run):

```sh
bash .claude/skills/visual-compare/scripts/setup.sh <base-ref> <head-ref> [label]
```

This: checks Supabase is up (starts stopped Docker containers; errors with
instructions if `npx supabase start` is needed); creates/reuses worktrees
`../gla_react-vc-base` and `../gla_react-vc-head` (npm ci and builds are cached
by lockfile/commit hash); copies `.env.local`/`.env.test` into them; starts
production servers on :3001 (base) and :3002 (head); installs pixelmatch/pngjs
beside the scripts; copies the capture spec to
`frontend/playwright/visual-compare.spec.ts`; creates the run dir
`visual-compare/<label>/` (default label `<base7>_vs_<head7>`) with `meta.json`.

If it fails, read its output — every failure mode prints what to do (missing
`.env.local`, Supabase down, server didn't start → check
`<run-dir>/<side>-server.log`). If the DB is empty/unseeded, run `npm run
db:reset` at the repo root first.

**Route coverage check:** run
`git diff --stat <base-ref>..<head-ref> -- frontend/src/app | grep page` — if
routes were added/renamed, edit the `capturePair(...)` lists at the bottom of
`frontend/playwright/visual-compare.spec.ts` (the copy) to include them. The
default list covers all app routes as of 2026-07. Note anything not capturable
(e.g. pages needing data that isn't seeded) for FINDINGS §4.

## Step 2 — Capture (10–25 min, run in background)

From `frontend/`, with the exact env values setup.sh printed:

```sh
VC_OUT=<abs-run-dir>/compare VC_BASE_URL=http://localhost:3001 VC_HEAD_URL=http://localhost:3002 \
  npx playwright test playwright/visual-compare.spec.ts --project firefox --reporter=line --workers=5 --retries=0
```

Run in the background; check the line-reporter output periodically. All 5 tests
must pass. A failed test means missing captures for its pages — fix (server log,
seed data) and re-run before proceeding; the spec overwrites captures in place.
Outputs land in `<run-dir>/compare/` as `<slug>.{base,head}.{json,png}`
(~25 page-states: public pages, presenter/organizer/log-viewer sessions,
user-menu-open state). Do NOT write outputs under `frontend/test-results/` —
Playwright wipes that directory at every run start.

## Step 3 — Diff

```sh
node .claude/skills/visual-compare/scripts/compare.js <abs-run-dir>
```

Writes to the run dir: `report.md`, `report.json`, and `compare/<slug>.diff.png`
per page. The diff already suppresses noise: canvas-normalised colors (identical
rgb-vs-oklch values don't diff), ≤5-RGB-unit shifts are grouped separately as
"palette re-derivation", transparent shadow layers / font-quoting serialisation
stripped, sub-pixel noise dropped, `text-decoration-color`/`outline-color` rows
that merely mirror a `color` change skipped.

## Step 4 — Analyse and write FINDINGS.md

Read `report.md`. Get the commit list: `git log --oneline <base>..<head>`.
For each **real style-change group**, hover/focus diff, structural diff, and
notable geometry shift, attribute it: find the causing commit (`git log -S`,
`git show <hash> --stat`, read the touched component) or identify it as a
framework/engine side effect. Then write `<run-dir>/FINDINGS.md` with exactly
these sections:

```markdown
# <head-ref> vs <base-ref> — rendered differences

Method: both refs built for production against the same seeded local Supabase
(base :3001, head :3002). N page-states captured in Firefox 1280×720 ...
Raw data: report.md / report.json, screenshots + pixel-diffs in compare/.

## 1. Intentional changes (match commits between the refs) — confirmed working
| # | Change | Evidence (pages) | Commit |
(one row per change; cite the commit hash you attributed it to)

### Screenshots — section 1 (left: base, right: head)
(per item: bold caption stating the change and source page, then)
| base | head |
|---|---|
| ![](crops/1-1.base.png) | ![](crops/1-1.head.png) |

## 2. Side effects worth confirming (probably fine, possibly unintended)
| # | Observation | Where | Root cause |
(changes with no matching commit intent — cascade/preflight/library effects;
name the mechanism, e.g. "v4 prose now out-orders space-y")

### Screenshots — section 2 (same format)

## 3. Engine-level differences with no practical visual impact
(bullets: palette re-derivation, margin-side swaps from space-y reimplementation,
serialisation noise, invisible-outline changes, etc. No screenshots.)

## 4. Coverage notes
(pages that 404ed or couldn't be captured, flows not exercised — dialogs,
toasts, mobile viewports, emails — and anything skipped from Step 1's route check)

## Per-page pixel change summary
(top pages by % from report.md's geometry table, each with a one-line explanation
tying it to items above; state the ceiling for the rest, e.g. "everything else ≤0.3%")
```

Rules: every §1/§2 item needs evidence (page + property + old→new values) and a
crop pair. An item goes in §1 only if you found the commit that intends it;
unexplained *visible* changes go in §2 with your best root-cause hypothesis,
never silently dropped. §3 needs no crops. If pixel-% is high on a page but all
diffs are explained, say so; if not explained, investigate before writing.

## Step 5 — Crops

Author `<run-dir>/crop-items.json` — one entry per §1/§2 item. The schema and
options (element matching via text/path/style-change, ancestor climb, padding,
fixed boxes) are documented in the header comment of
`.claude/skills/visual-compare/scripts/crop.js`. Two things that will bite you:

- `find.from`/`find.to` match the **normalized captured values** (hex like
  `#5837b9`, or `rgba(0, 0, 0, 0)`) — pull exact values from `report.md`.
- **Sticky elements** (nav bar, logs filter bar) render at the stitched
  last-viewport position in fullPage screenshots — rect-based crops of them are
  wrong. Use `fixedBoxBase`/`fixedBoxHead` with per-side coordinates (find them
  via the element's recorded rect ± the page-height difference, or trial crops).

```sh
node .claude/skills/visual-compare/scripts/crop.js <abs-run-dir>
```

Every item must print `ok` (the script exits 2 otherwise). Then *look at each
crop pair* (this is the one legitimate image-reading step — you are checking the
crop shows the right region, not re-diagnosing) and fix items that cropped the
wrong area. Embed as relative `crops/...` links — FINDINGS.md lives in the run
dir so the links work as-is.

## Step 6 — Teardown and report

```sh
bash .claude/skills/visual-compare/scripts/teardown.sh <abs-run-dir>
```

Kills both servers and removes the copied spec. **Keep the worktrees** (they
cache installs/builds for the next run); add `--remove-worktrees` only if the
user asks to clean up fully.

Tell the user: where FINDINGS.md is, the §1/§2 counts, and the §2 items (those
are the ones needing their judgement). Everything under `visual-compare/` is
gitignored and persists across runs — old run dirs are the comparison history.

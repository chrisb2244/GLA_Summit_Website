<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Playwright and Test Command Defaults

When running Playwright tests in this repository:

- The `npm run playwright` script bakes in `--project=chromium` (the default browser). Run it from the frontend directory: `npm run playwright -- --reporter=line ...`
- Do NOT append `--project firefox` to `npm run playwright` — Playwright's `--project` flag is additive, so that runs BOTH browsers. For a Firefox-only run use `npx playwright test --project firefox --reporter=line`.
- Run Playwright in non-interactive mode so results stay in terminal output.
- Use a terminal reporter (for example `--reporter=line`) to prevent auto-opening HTML reports or browser pages.
- Do not use `--ui`, `show-report`, or any command/flag that opens a browser window for test results.
- Auth: a `setup` project (`playwright/auth.setup.ts`) mints one logged-in storageState per role into `playwright/.auth/` for read-only tests; it runs automatically as a dependency and its users are deleted by `auth.teardown.ts`. Identity-bound tests provision their own user per test and log in with `loginOnPage`, which mints the OTP via the admin API (no inbox polling); only `user-login.spec.ts` exercises the real OTP email round-trip.
- Filtered runs whose tests use no shared auth state (e.g. `--grep @synthetic`) can add `--no-deps` to skip the setup project (`--grep` does not filter dependency projects).
- Smoke subset: `CI=1 npm run playwright -- --grep @smoke --reporter=line`
- CI e2e runs live in `.github/workflows/e2e.yml` (build + `next start` against the TEST Supabase project) and `.github/workflows/synthetic-deploy.yml` (`@synthetic` against a deployment).
- For full-suite local runs, prefer a production server (`npm run build`, then `USE_MOCK_EMAIL=true npm start`): under full-suite load the dev server's Turbopack filesystem cache can corrupt (every route 500s with a JSON.parse error) and only recovers after deleting `.next`.

When running frontend tests or scripts:

- Run from the frontend directory unless explicitly told otherwise.
- Do not run test commands from repository root when they target the frontend app.

# General rules
- Do not push changes
- Do not make changes on GitHub without explicit instruction

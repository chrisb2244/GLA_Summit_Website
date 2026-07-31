<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

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

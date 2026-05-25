<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Playwright and Test Command Defaults

When running Playwright tests in this repository:

- Prefer the Firefox project by default.
- Use commands in this form: `cd frontend && npm run playwright -- --project firefox ...` (when starting from repository root), or run the same `npm run playwright -- --project firefox ...` command directly from the frontend directory.

When running frontend tests or scripts:

- Run from the frontend directory unless explicitly told otherwise.
- Do not run test commands from repository root when they target the frontend app.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

```
/                   – root: Supabase CLI tooling, docker-compose, scripts
/frontend/          – Next.js app (primary codebase)
/supabase/          – DB migrations, seeds, config.toml
/email-generation/  – standalone email template tooling
```

All web development work happens under `frontend/`. Run frontend commands from that directory.

## Commands

### Root (Supabase tooling)

```sh
npm install                  # install Supabase CLI + TypeScript deps
npx supabase start           # start local Supabase (Docker required)
npx supabase stop
npm run gen_types            # regenerate frontend/src/lib/sb_databaseModels.ts from local DB
npm run db:reset             # reset DB + re-seed avatar storage
```

### Frontend (`cd frontend` first)

```sh
npm install
npm run dev                  # dev server with USE_MOCK_EMAIL=true (recommended for local)
npm run dev_full             # dev server without mock email override
npm run build                # production build
npm run lint                 # ESLint
npm run test                 # Vitest unit tests (run all)
npx vitest run path/to/file  # run a single unit test file
npm run playwright -- --project firefox --reporter=line            # all e2e tests
npm run playwright -- --project firefox --reporter=line --grep @smoke  # smoke subset
PW_REUSE_AUTH=1 npm run playwright -- --project firefox --reporter=line  # reuse stored auth
```

Never run Playwright with `--ui`, `show-report`, or flags that open a browser window. Always pass `--reporter=line`.

## Environment setup

Copy `frontend/.env.local.sample` to `frontend/.env.local` and fill in the keys printed by `npx supabase start`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321   # note: 5532x ports, not default 5432x
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SECRET_SUPABASE_SERVICE_KEY=<service_role key>
USE_MOCK_EMAIL=true
NEXT_IMAGE_UNOPTIMIZED=true                        # required locally (Next.js SSRF protection)
```

The local Supabase config uses ports in the `5532x` range (configured in `supabase/config.toml`) to avoid WSL2 reserved port range conflicts with the default `5432x` ports.

## Architecture

### Next.js App Router

`frontend/src/app/` uses the App Router. Pages needing authentication check the session server-side. `frontend/src/app/configConstants.ts` holds event-level feature flags and year constants — check here first when toggling submission availability (`CAN_SUBMIT_PRESENTATION`, `CAN_SUBMIT_DRAFT`) or changing the active year (`currentDisplayYear`, `submissionsForYear`).

### Supabase client tiers

There are three distinct Supabase client patterns, each with different privileges:

| Client | File | Use |
|---|---|---|
| `supabase` (browser) | `src/lib/supabaseClient.ts` | Client components, uses anon key |
| `createAdminClient()` | `src/lib/supabaseClient.ts` | Server-only; uses `SECRET_SUPABASE_SERVICE_KEY`; bypasses RLS |
| `createServerClient()` | `src/lib/supabaseServer.ts` | SSR with user session cookies (via `@supabase/ssr`) |
| anon server client | `src/lib/supabase/public.ts` | Server-side, no user session, used for cached public data |

`SECRET_SUPABASE_SERVICE_KEY` is never accessible in the browser (no `NEXT_PUBLIC_` prefix). The admin client bypasses RLS — use it only in server actions/route handlers.

### Data fetching and caching

Public/cacheable data lives in `src/lib/supabase/public.ts`. These functions use Next.js `'use cache'` with `cacheLife` and `cacheTag` for long-lived server-side caching. Cache tags are defined in `src/lib/supabase/cacheTags.ts`.

Authenticated queries that need the current user's session are in `src/lib/supabase/authorized.ts`. These are dynamic (not cached) because they depend on request cookies.

### TypeScript types

`src/lib/sb_databaseModels.ts` is **auto-generated** by `npm run gen_types` — never edit it manually. Application-level types (re-exports and derived types) live in `src/lib/databaseModels.ts`. When the Supabase schema changes, run `npm run gen_types` and update `databaseModels.ts` if needed.

The `SummitYear` enum is exhaustively checked via a compile-time guard in `databaseModels.ts` — adding a new year to the DB requires updating the `summityears` constant there.

### Error logging

`logErrorToDb()` in `src/lib/utils.tsx` writes errors to a `log` table in Supabase using the admin client. Use it for server-side errors that should be visible in production.

### Auth roles

Four roles are used throughout: `admin`, `organizer`, `presenter`, `attendee`. Playwright auth setup (`playwright/auth.setup.ts`) stores session state per role in `playwright/.auth/*.json`.

## Before Next.js work

Read the relevant doc in `node_modules/next/dist/docs/` before coding — training data is outdated and the local docs are authoritative.

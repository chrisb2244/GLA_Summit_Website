# CLAUDE.md

## Repo layout

```
/                  – Supabase CLI tooling, docker-compose, scripts
/frontend/         – Next.js app (primary codebase; run all frontend commands here)
/supabase/         – DB migrations, seeds, config.toml
/email-generation/ – standalone email template tooling
```

## Commands

**Root**

```sh
npx supabase start/stop        # requires Docker
npm run gen_types              # regenerate frontend/src/lib/sb_databaseModels.ts
npm run db:reset               # reset DB + re-seed avatar storage
```

**Frontend** (`cd frontend` first)

```sh
npm run dev                    # dev server (USE_MOCK_EMAIL=true)
npm run dev_full               # dev server without mock email override
npm run build / lint / test
npx vitest run path/to/file
npm run playwright -- --project firefox --reporter=line [--grep @smoke]
PW_REUSE_AUTH=1 npm run playwright -- --project firefox --reporter=line
```

Never use `--ui`, `show-report`, or any flag that opens a browser window with Playwright. Always pass `--reporter=line`.

## Environment

Copy `frontend/.env.local.sample` → `frontend/.env.local`. Keys from `npx supabase start`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321  # 5532x ports (not 5432x — WSL2 conflict avoidance)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SECRET_SUPABASE_SERVICE_KEY=<service_role key>
USE_MOCK_EMAIL=true
NEXT_IMAGE_UNOPTIMIZED=true                       # required locally (Next.js SSRF protection)
```

## Architecture

### Feature flags & year constants

`frontend/src/app/configConstants.ts` — toggle submission availability (`CAN_SUBMIT_PRESENTATION`, `CAN_SUBMIT_DRAFT`) and active year (`currentDisplayYear`, `submissionsForYear`).

### Supabase clients

| Client                 | File                         | Use                            |
| ---------------------- | ---------------------------- | ------------------------------ |
| `supabase` (browser)   | `src/lib/supabaseClient.ts`  | Client components, anon key    |
| `createAdminClient()`  | `src/lib/supabaseClient.ts`  | Server-only; bypasses RLS      |
| `createServerClient()` | `src/lib/supabaseServer.ts`  | SSR with user session cookies  |
| anon server client     | `src/lib/supabase/public.ts` | Cached public data, no session |

Admin client (`SECRET_SUPABASE_SERVICE_KEY`) bypasses RLS — server actions/route handlers only.

### Data fetching

- `src/lib/supabase/public.ts` — cached public data (`'use cache'`, tags in `cacheTags.ts`)
- `src/lib/supabase/authorized.ts` — authenticated queries (dynamic, not cached)

### TypeScript types

`src/lib/sb_databaseModels.ts` is auto-generated (`npm run gen_types`) — never edit manually. App types in `src/lib/databaseModels.ts`. Adding a new DB year requires updating the `summityears` constant (exhaustive compile-time guard).

### Misc

- Error/message logging: `logToDb()` in `src/lib/utils.tsx` → `log` table via admin client
- Auth roles: `admin`, `organizer`, `presenter`, `attendee`; Playwright session state in `playwright/.auth/*.json`

## Before Next.js work

Read `node_modules/next/dist/docs/` — training data is outdated, local docs are authoritative.

**When starting work on a Next.js project, ALWAYS call the `init` tool from
next-devtools-mcp FIRST to set up proper context and establish documentation
requirements. Do this automatically without being asked.**

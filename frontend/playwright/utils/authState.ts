import path from 'node:path';

// Shared per-role authenticated sessions, minted once per run by
// playwright/auth.setup.ts (a dependency of the browser projects) and torn
// down by playwright/auth.teardown.ts. Specs opt in with
// `test.use({ storageState: authStatePath(role) })`.
//
// Only READ-ONLY, identity-agnostic tests may share these sessions: the state
// user's rows persist for the whole run and are visible to every test using
// the same role, so anything that mutates the logged-in user's data or
// asserts on their specific identity must provision its own user (see
// userCreation.ts) and log in with loginOnPage instead.
//
// Sharing one session across parallel workers is safe here because the tokens
// are minted fresh each run: Supabase only rotates the refresh token when the
// access token nears expiry (1h locally), so no rotation — and therefore no
// cross-worker invalidation — happens within a run. Do not reuse these files
// across runs.
export const SHARED_AUTH_ROLES = [
  'attendee',
  'presenter',
  'organizer',
  'log_viewer',
  'concluder'
] as const;

export type SharedAuthRole = (typeof SHARED_AUTH_ROLES)[number];

export const authStateDir = path.resolve(__dirname, '../.auth');

export const authStatePath = (role: SharedAuthRole) =>
  path.join(authStateDir, `${role}.json`);

// Per-role manifest recording the created user's id so auth.teardown.ts can
// delete it (one file per role — parallel setup tests must not share a file).
// The seeded concluder is long-lived and never gets a manifest.
export const authUserManifestPath = (role: SharedAuthRole) =>
  path.join(authStateDir, `${role}.user.json`);

// Extract the Supabase JWT access token from a Playwright storage state object
// (as returned by context.storageState()). Used to build an RLS-constrained
// Supabase client for testing direct database access without going through the
// browser, and to check the session's remaining lifetime in auth.setup.ts.
export type StorageState = {
  cookies?: Array<{ name: string; value: string }>;
  origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
};

export const getAccessToken = (state: StorageState): string => {
  // @supabase/ssr stores the session in a cookie as `base64-{base64url(JSON)}`.
  // Decode that to extract the access_token JWT.
  const extractTokenFromSessionValue = (raw: string): string => {
    if (raw.startsWith('base64-')) {
      const json = Buffer.from(raw.slice('base64-'.length), 'base64').toString(
        'utf-8'
      );
      return (JSON.parse(json) as { access_token: string }).access_token;
    }
    // Fallback: plain JSON-encoded session object.
    try {
      return (JSON.parse(raw) as { access_token: string }).access_token;
    } catch {
      return raw;
    }
  };

  for (const cookie of state.cookies ?? []) {
    if (cookie.name.includes('auth-token')) {
      return extractTokenFromSessionValue(cookie.value);
    }
  }

  for (const origin of state.origins ?? []) {
    for (const item of origin.localStorage ?? []) {
      if (item.name.includes('auth-token')) {
        return (JSON.parse(item.value) as { access_token: string })
          .access_token;
      }
    }
  }

  throw new Error('No Supabase auth token found in storage state');
};

// Every worker reuses these states for the whole run and nothing refreshes
// them (see the sharing note above), so the run has to finish comfortably
// inside the access token's lifetime. Once auth-js (or the proxy's
// updateSession) reaches its 90s pre-expiry refresh margin, several workers
// redeem the SAME refresh token within seconds of each other; GoTrue rotates
// on redemption, so all but one get a revoked token and the shared session
// dies for every test still using it. That surfaces as a mass logout with no
// obvious cause, so assert the margin here instead, where the cause is plain.
const MIN_REMAINING_SESSION_MS = 15 * 60 * 1000;

export const assertSessionOutlastsRun = (
  state: StorageState,
  role: SharedAuthRole
) => {
  const payload = getAccessToken(state).split('.')[1];
  if (!payload) {
    throw new Error(`Shared ${role} access token is not a JWT`);
  }
  const { exp } = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf-8')
  ) as { exp?: number };
  if (typeof exp !== 'number') {
    throw new Error(`Shared ${role} access token has no exp claim`);
  }

  const remainingMs = exp * 1000 - Date.now();
  if (remainingMs < MIN_REMAINING_SESSION_MS) {
    throw new Error(
      `Shared ${role} session expires in ${Math.round(remainingMs / 1000)}s, ` +
        `below the ${MIN_REMAINING_SESSION_MS / 60000} minute minimum. Every ` +
        `worker shares this session and none of them may refresh it, so the ` +
        `whole run must fit inside its lifetime. Raise jwt_expiry on the ` +
        `target Supabase project (local default: 3600s, see ` +
        `supabase/config.toml).`
    );
  }
};

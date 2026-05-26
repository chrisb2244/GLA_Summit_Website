import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/sb_databaseModels';
import { ticketYear } from '@/app/configConstants';
import { createSupabaseAdmin } from './utils';

const presenterStorageState = path.resolve(
  __dirname,
  '.auth',
  'presenter.json'
);
const attendeeStorageState = path.resolve(__dirname, '.auth', 'attendee.json');

const TICKET_PAGE_PATTERN = /\/ticket\/.+/;

// Navigate to /ticket, wait for the redirect and for the ticket image to
// finish loading (it arrives via SSR streaming), then return both the
// resolved URL and the image locator.
const openTicket = async (page: Page) => {
  await page.goto('/ticket');
  await page.waitForURL(TICKET_PAGE_PATTERN, { timeout: 15000 });
  const img = page.getByRole('img', { name: 'My GLA Summit Ticket' });
  await expect(img).toBeVisible({ timeout: 15000 });
  return { url: page.url(), img };
};

// Parse a Playwright storage state file and return the Supabase JWT access
// token stored inside it.  Used to build an RLS-constrained Supabase client
// for testing direct database access without going through the browser.
const getAccessToken = (storageStatePath: string): string => {
  const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8')) as {
    cookies?: Array<{ name: string; value: string }>;
    origins?: Array<{
      localStorage?: Array<{ name: string; value: string }>;
    }>;
  };

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

  throw new Error(
    `No Supabase auth token found in storage state: ${storageStatePath}`
  );
};

// Create an authenticated Supabase client that operates under RLS (uses the
// anon key + user JWT, not the service key).
const createUserClient = (accessToken: string) =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );

// ── Visual regression ────────────────────────────────────────────────────────

test.describe('attendee ticket', () => {
  test.use({ storageState: attendeeStorageState });

  test('renders expected ticket image', { tag: '@smoke' }, async ({ page }) => {
    const { img } = await openTicket(page);
    // First run creates the baseline; subsequent runs diff against it.
    await expect(img).toHaveScreenshot('attendee-ticket.png', {
      maxDiffPixelRatio: 0.02
    });
  });

  test("shows the owner view heading (You're all set to go!)", async ({
    page
  }) => {
    await openTicket(page);
    await expect(
      page.getByRole('heading', { name: "You're all set to go!" })
    ).toBeVisible();
  });
});

test.describe('presenter ticket', () => {
  test.use({ storageState: presenterStorageState });

  test('renders expected ticket image', { tag: '@smoke' }, async ({ page }) => {
    const { img } = await openTicket(page);
    await expect(img).toHaveScreenshot('presenter-ticket.png', {
      maxDiffPixelRatio: 0.02
    });
  });

  test("shows the owner view heading (You're all set to go!)", async ({
    page
  }) => {
    await openTicket(page);
    await expect(
      page.getByRole('heading', { name: "You're all set to go!" })
    ).toBeVisible();
  });
});

// ── Ticket sharing ────────────────────────────────────────────────────────────
//
// The shareable ticket URL carries all ticket data as a HMAC-signed base64
// parameter; no session is required to view it.  Both an authenticated
// visitor and an anonymous visitor should see the "shared" view, which
// includes the "This is X's ticket" heading rather than the owner controls.

test.describe('ticket sharing', () => {
  test.use({ storageState: attendeeStorageState });

  test('another authenticated user sees the shared view', async ({
    page,
    browser
  }) => {
    const { url: ticketUrl } = await openTicket(page);

    const presenterContext = await browser.newContext({
      storageState: presenterStorageState
    });
    try {
      const presenterPage = await presenterContext.newPage();
      await presenterPage.goto(ticketUrl);
      await expect(
        presenterPage.getByRole('img', { name: 'My GLA Summit Ticket' })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        presenterPage.getByText(/This is .+'s ticket/, { exact: false })
      ).toBeVisible();
    } finally {
      await presenterContext.close();
    }
  });

  test('anonymous visitor sees the shared view', async ({ browser }) => {
    // Step 1: acquire a valid ticket URL using the attendee's credentials.
    // This context is closed before the anonymous check begins, so no session
    // state leaks into the anonymous browser context below.
    const attendeeContext = await browser.newContext({
      storageState: attendeeStorageState
    });
    let ticketUrl: string;
    try {
      const attendeePage = await attendeeContext.newPage();
      ({ url: ticketUrl } = await openTicket(attendeePage));
    } finally {
      await attendeeContext.close();
    }

    // Step 2: visit the ticket URL with no session at all.
    // browser.newContext() with no storageState creates a completely isolated
    // context — no cookies, no localStorage, no Supabase session.
    const anonContext = await browser.newContext({
      storageState: undefined
    });
    try {
      const anonPage = await anonContext.newPage();
      await anonPage.goto(ticketUrl);
      await expect(
        anonPage.getByRole('img', { name: 'My GLA Summit Ticket' })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        anonPage.getByText(/This is .+'s ticket/, { exact: false })
      ).toBeVisible();
    } finally {
      await anonContext.close();
    }
  });
});

// ── Impersonation protection ──────────────────────────────────────────────────

test.describe('impersonation protection', () => {
  // ── URL-layer: HMAC signing ──────────────────────────────────────────────
  //
  // The ticket URL carries an HMAC token computed over the data payload.
  // The image API (/api/ticket) validates this token before generating the
  // PNG; a URL with a modified payload but the original token is rejected
  // with 401, causing the display page to show an error.
  //
  // Note: checkToken() itself is unit-tested in utils.test.ts; this test
  // verifies the end-to-end page behaviour when the API rejects the request.

  test.describe('tampered URL causes image load failure', () => {
    test.use({ storageState: attendeeStorageState });

    test('modifying the userId invalidates the HMAC and shows an error', async ({
      page
    }) => {
      const { url: ticketUrl } = await openTicket(page);

      // Decode the path parameter, substitute a different userId, re-encode
      // without updating the HMAC token.
      const urlPath = new URL(ticketUrl).pathname;
      const encoded = urlPath.split('/').at(-1)!;
      const decoded = JSON.parse(
        Buffer.from(decodeURIComponent(encoded), 'base64url').toString('utf-8')
      ) as { data: { userId: string }; token: string };
      decoded.data.userId = '00000000-0000-0000-0000-000000000000';
      const tampered = encodeURIComponent(
        Buffer.from(JSON.stringify(decoded)).toString('base64url')
      );

      await page.goto(ticketUrl.replace(encoded, tampered));

      await expect(
        page.getByText('Failed to fetch ticket data', { exact: false }).first()
      ).toBeVisible({ timeout: 15000 });
    });
  });

  // ── Database layer: Row Level Security ───────────────────────────────────
  //
  // The get_or_create_ticket RPC uses auth.uid() internally so there is no
  // user_id parameter to manipulate via the application flow — impersonation
  // via the RPC is architecturally impossible.  These tests verify the
  // defence-in-depth at the database layer: the RLS WITH CHECK policy on the
  // tickets table rejects a direct authenticated INSERT for a different
  // user_id.
  //
  // These tests do not use a browser; they call Supabase directly from the
  // test runner using the stored session JWT.

  test('attendee cannot directly insert a ticket row for another user (RLS)', async () => {
    test.skip(
      !fs.existsSync(attendeeStorageState),
      'Auth state not available — run auth setup first'
    );

    const admin = createSupabaseAdmin();
    const { data: presenterLookup } = await admin
      .from('email_lookup')
      .select('id')
      .eq('email', process.env.TEST_PRESENTER_EMAIL as string)
      .single();

    const presenterUserId = presenterLookup?.id;
    if (!presenterUserId) {
      throw new Error(
        'TEST_PRESENTER_EMAIL user not found in email_lookup — is the test DB seeded?'
      );
    }

    const attendeeToken = getAccessToken(attendeeStorageState);
    const attendeeClient = createUserClient(attendeeToken);

    const { error } = await attendeeClient.from('tickets').insert({
      user_id: presenterUserId,
      year: ticketYear,
      ticket_number: 0
    });

    expect(error).not.toBeNull();
    // Supabase/PostgREST surfaces WITH CHECK violations as PostgreSQL error
    // code 42501 (insufficient_privilege).
    expect(error?.message).toMatch(
      /row-level security|insufficient_privilege|violates/i
    );
  });
});

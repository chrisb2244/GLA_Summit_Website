import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/sb_databaseModels';
import { ticketYear } from '@/app/configConstants';
import {
  createAttendee,
  createPresenter,
  loginOnPage,
  seedTicket,
  type SeededUser
} from './utils';

const TICKET_PAGE_PATTERN = /\/ticket\/.+/;

// Fixed, high ticket numbers so the rendered ticket image is deterministic for
// the screenshot regression tests. They are well above any seeded sequence
// value, so get_or_create_ticket never assigns them to another visitor.
const ATTENDEE_TICKET_NUMBER = 101;
const PRESENTER_TICKET_NUMBER = 102;

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

// Extract the Supabase JWT access token from a Playwright storage state object
// (as returned by context.storageState()). Used to build an RLS-constrained
// Supabase client for testing direct database access without going through the
// browser.
type StorageState = {
  cookies?: Array<{ name: string; value: string }>;
  origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
};

const getAccessToken = (state: StorageState): string => {
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
  let user: SeededUser;

  test.beforeEach(async ({ page }) => {
    user = await createAttendee();
    await page.goto('/');
    await loginOnPage(page, user.email);
  });

  test.afterEach(async () => {
    await user?.cleanup();
  });

  test(
    'renders expected ticket image',
    { tag: '@regression' },
    async ({ page }) => {
      // Pin the ticket number so the rendered image is deterministic.
      await seedTicket(user.userId, ATTENDEE_TICKET_NUMBER);
      const { img } = await openTicket(page);
      // First run creates the baseline; subsequent runs diff against it.
      await expect(img).toHaveScreenshot('attendee-ticket.png', {
        maxDiffPixelRatio: 0.02
      });
    }
  );

  test("shows the owner view heading (You're all set to go!)", { tag: '@smoke' }, async ({
    page
  }) => {
    await openTicket(page);
    await expect(
      page.getByRole('heading', { name: "You're all set to go!" })
    ).toBeVisible();
  });
});

test.describe('presenter ticket', () => {
  let user: SeededUser;

  test.beforeEach(async ({ page }) => {
    // A presenter has an accepted presentation for the current ticketYear, which
    // is what flips the ticket into the presenter view.
    user = await createPresenter();
    await page.goto('/');
    await loginOnPage(page, user.email);
  });

  test.afterEach(async () => {
    await user?.cleanup();
  });

  test(
    'renders expected ticket image',
    { tag: '@regression' },
    async ({ page }) => {
      // Pin the ticket number so the rendered image is deterministic.
      await seedTicket(user.userId, PRESENTER_TICKET_NUMBER);
      const { img } = await openTicket(page);
      await expect(img).toHaveScreenshot('presenter-ticket.png', {
        maxDiffPixelRatio: 0.02
      });
    }
  );

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
  let owner: SeededUser;

  test.beforeEach(async ({ page }) => {
    owner = await createAttendee();
    await page.goto('/');
    await loginOnPage(page, owner.email);
  });

  test.afterEach(async () => {
    await owner?.cleanup();
  });

  test('another authenticated user sees the shared view', async ({
    page,
    browser
  }) => {
    const { url: ticketUrl } = await openTicket(page);

    const viewer = await createAttendee();
    const viewerContext = await browser.newContext();
    try {
      const viewerPage = await viewerContext.newPage();
      await viewerPage.goto('/');
      await loginOnPage(viewerPage, viewer.email);
      await viewerPage.goto(ticketUrl);
      await expect(
        viewerPage.getByRole('img', { name: 'My GLA Summit Ticket' })
      ).toBeVisible({ timeout: 15000 });
      await expect(
        viewerPage.getByText(/This is .+'s ticket/, { exact: false })
      ).toBeVisible();
    } finally {
      await viewerContext.close();
      await viewer.cleanup();
    }
  });

  test('anonymous visitor sees the shared view', async ({ page, browser }) => {
    // The owner (logged in via beforeEach) acquires a valid ticket URL.
    const { url: ticketUrl } = await openTicket(page);

    // Visit the ticket URL with no session at all. browser.newContext() with no
    // storageState creates a completely isolated context — no cookies, no
    // localStorage, no Supabase session.
    const anonContext = await browser.newContext({ storageState: undefined });
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
    let user: SeededUser;

    test.beforeEach(async ({ page }) => {
      user = await createAttendee();
      await page.goto('/');
      await loginOnPage(page, user.email);
    });

    test.afterEach(async () => {
      await user?.cleanup();
    });

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
  // via the RPC is architecturally impossible.  This test verifies the
  // defence-in-depth at the database layer: the RLS WITH CHECK policy on the
  // tickets table rejects a direct authenticated INSERT for a different
  // user_id.
  //
  // It does not use a browser page for the assertion; it logs an attendee in
  // (in an isolated context) only to obtain their session JWT, then calls
  // Supabase directly from the test runner.

  test('attendee cannot directly insert a ticket row for another user (RLS)', async ({
    browser
  }) => {
    const actor = await createAttendee();
    const victim = await createAttendee();
    const context: BrowserContext = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto('/');
      await loginOnPage(page, actor.email);

      const actorToken = getAccessToken(await context.storageState());
      const actorClient = createUserClient(actorToken);

      const { error } = await actorClient.from('tickets').insert({
        user_id: victim.userId,
        year: ticketYear,
        ticket_number: 0
      });

      expect(error).not.toBeNull();
      // Supabase/PostgREST surfaces WITH CHECK violations as PostgreSQL error
      // code 42501 (insufficient_privilege).
      expect(error?.message).toMatch(
        /row-level security|insufficient_privilege|violates/i
      );
    } finally {
      await context.close();
      await actor.cleanup();
      await victim.cleanup();
    }
  });
});

import { test, expect } from '@playwright/test';
import { createAttendee, loginOnPage, type SeededUser } from './utils/index';

/**
 * Verifies that image requests are routed through CDN / Vercel optimisation
 * rather than making expensive uncached Supabase storage API calls.
 *
 * Key invariants being tested:
 *  1. UserMenu never calls the Supabase storage download API on page load.
 *  2. Avatar image src is never a blob: URL.
 *  3. Presenter images on /presenters are routed through /_next/image (Vercel
 *     fetches from Supabase server-side, so the browser never hits Supabase storage
 *     directly for these images).
 *  4. /_next/image only requests widths from our configured allowlist.
 */

// The authenticated storage download path looks like:
//   /storage/v1/object/avatars/<path>
// The CDN public path looks like:
//   /storage/v1/object/public/avatars/<path>
// The regex below matches only the former (no "public" segment).
const SUPABASE_DOWNLOAD_API = /\/storage\/v1\/object\/avatars\//;

// Direct browser request to the Supabase CDN (indicates a bare <img> rather than <Image>).
const SUPABASE_CDN_AVATAR =
  /supabase\.co\/storage\/v1\/object\/public\/avatars\//;

// Widths permitted by next.config.ts (imageSizes ∪ deviceSizes).
const ALLOWED_IMAGE_WIDTHS = new Set(['320', '640', '1080', '1920']);

test.describe('UserMenu avatar — logged-in user', () => {
  let user: SeededUser;

  test.beforeEach(async () => {
    user = await createAttendee();
  });

  test.afterEach(async () => {
    await user?.cleanup();
  });

  test('page load does not trigger a Supabase storage download API call', async ({
    page
  }) => {
    const downloadApiRequests: string[] = [];

    await page.route(SUPABASE_DOWNLOAD_API, (route) => {
      downloadApiRequests.push(route.request().url());
      route.continue();
    });

    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.waitForLoadState('networkidle');

    expect(
      downloadApiRequests,
      'Supabase storage .download() API must not be called on page load — use getPublicUrl() instead'
    ).toHaveLength(0);
  });

  test('avatar image src is not a blob: URL', async ({ page }) => {
    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.getByTestId('user-menu-button').waitFor({ state: 'visible' });

    const avatarImg = page.getByTestId('user-menu-button').locator('img');
    if ((await avatarImg.count()) === 0) {
      // This user has no avatar — the default MDI icon is shown, nothing to assert.
      return;
    }

    const src = await avatarImg.first().getAttribute('src');
    expect(src, 'Avatar must not be a blob: URL').not.toMatch(/^blob:/);
    expect(src, 'Avatar must be served from an https:// URL').toMatch(
      /^https?:\/\//
    );
  });
});

test.describe('Presenter list page — image routing', () => {
  test(
    'presenter avatar images are served via /_next/image',
    {
      tag: ['@smoke', '@synthetic']
    },
    async ({ page }) => {
      // The image optimizer runs both locally and in production (locally,
      // NEXT_IMAGE_ALLOW_LOCAL_IP=true lets it fetch from 127.0.0.1), so <Image>
      // always emits /_next/image URLs and this assertion applies everywhere.
      await page.goto('/presenters');
      await page.waitForLoadState('networkidle');

      const presenterImages = page.locator('img[alt^="Image of"]');
      const count = await presenterImages.count();

      if (count === 0) {
        // No accepted presenters with avatars in this environment.
        return;
      }

      for (let i = 0; i < count; i++) {
        const src = await presenterImages.nth(i).getAttribute('src');
        expect(
          src,
          `Presenter image [${i}] should be served via /_next/image, not as a bare URL`
        ).toMatch(/^\/_next\/image\?url=/);
      }
    }
  );

  test(
    'browser makes no direct requests to Supabase storage for presenter images',
    {
      tag: '@regression'
    },
    async ({ page }) => {
      const directStorageRequests: string[] = [];

      // With <Image>, Next.js fetches from Supabase server-side and caches the result.
      // The browser should only ever see /_next/image URLs, never raw Supabase CDN URLs.
      await page.route(SUPABASE_CDN_AVATAR, (route) => {
        directStorageRequests.push(route.request().url());
        route.continue();
      });

      await page.goto('/presenters');
      await page.waitForLoadState('networkidle');

      expect(
        directStorageRequests,
        'Presenter images should be fetched server-side via /_next/image, not directly by the browser'
      ).toHaveLength(0);
    }
  );

  test(
    '/_next/image requests only use configured width values',
    {
      tag: '@regression'
    },
    async ({ page }) => {
      const unexpectedWidths: string[] = [];

      await page.route('**/_next/image**', (route) => {
        const url = new URL(route.request().url());
        const w = url.searchParams.get('w');
        if (w && !ALLOWED_IMAGE_WIDTHS.has(w)) {
          unexpectedWidths.push(w);
        }
        route.continue();
      });

      await page.goto('/presenters');
      await page.waitForLoadState('networkidle');

      expect(
        unexpectedWidths,
        `/_next/image used widths outside the configured set {${[
          ...ALLOWED_IMAGE_WIDTHS
        ].join(', ')}}: ${unexpectedWidths.join(', ')}`
      ).toHaveLength(0);
    }
  );
});

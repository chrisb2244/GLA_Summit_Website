import { test, expect, type Page } from '@playwright/test';

// TimestampSpan renders in two phases (see its `TimestampZone` doc):
//   data-zone="utc"   – server/prerender output and the hydration render:
//                       fixed UTC + en-GB text, identical whatever the build
//                       machine's or viewer's timezone.
//   data-zone="local" – after hydration, in the viewer's timezone.
// Each phase is asserted on directly, across several viewer timezones.
//
// The pre-hydration phase is observed with JavaScript disabled: the browser
// then shows exactly the server HTML.

const TITLE = 'LabVIEW is a game: HiFi Graphics and Web UIs in LabVIEW Apps';
// Seeded: 2024-03-26T02:00Z, 45 minutes.
const UTC_SINGLE = '02:00 UTC';
const UTC_RANGE = '26 March 2024, 02:00 – 02:45 UTC';

// Independent oracle: the wall-clock digits each zone must show. The zone
// label after them (PDT / GMT+13 / UTC …) is left to the browser's ICU.
const VIEWER_ZONES = [
  { timezoneId: 'UTC', single: /^02:00\b/, range: /02:00\s*[–-]\s*02:45/ },
  {
    // UTC+13 (NZDT) — ahead of UTC and of the usual dev/CI zones.
    timezoneId: 'Pacific/Auckland',
    single: /^15:00\b/,
    range: /15:00\s*[–-]\s*15:45/
  },
  {
    // UTC-7 (PDT) — also lands on the previous calendar day.
    timezoneId: 'America/Los_Angeles',
    single: /^19:00\b/,
    range: /March 25, 2024.*19:00\s*[–-]\s*19:45/
  }
];

/** The card's timestamp on /presentation-list. */
const listTimestamp = (page: Page) =>
  page
    .getByRole('link', { name: TITLE })
    .locator('xpath=..')
    .locator('[data-zone]');

/**
 * Collects hydration errors. TimestampSpan no longer uses
 * suppressHydrationWarning, so a mismatch between the server text and the
 * hydration render surfaces here (dev: a console error; prod: React #418).
 */
const trackHydrationErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && /hydrat|#418|#425/i.test(m.text())) {
      errors.push(m.text());
    }
  });
  return errors;
};

test.describe('Timestamps render UTC on the server, local after hydration', () => {
  for (const zone of VIEWER_ZONES) {
    test.describe(`viewer in ${zone.timezoneId}`, () => {
      test.use({ timezoneId: zone.timezoneId });

      test.describe('server HTML (no JavaScript)', () => {
        test.use({ javaScriptEnabled: false });

        test(
          'shows fixed UTC text regardless of viewer zone',
          { tag: '@regression' },
          async ({ page }) => {
            await page.goto('/presentation-list/2024');
            const ts = listTimestamp(page);
            await expect(ts).toHaveAttribute('data-zone', 'utc');
            await expect(ts).toHaveText(UTC_SINGLE);

            await page.getByRole('link', { name: TITLE }).click();
            const range = page.locator('[data-zone]').first();
            await expect(range).toHaveAttribute('data-zone', 'utc');
            await expect(range).toHaveText(UTC_RANGE);
          }
        );
      });

      test(
        'hydrates to the viewer’s local time without a mismatch',
        { tag: '@regression' },
        async ({ page }) => {
          const errors = trackHydrationErrors(page);

          await page.goto('/presentation-list/2024');
          const ts = listTimestamp(page);
          await expect(ts).toHaveAttribute('data-zone', 'local');
          await expect(ts).toHaveText(zone.single);

          // Client-side navigation: the destination renders straight into the
          // local zone (useIsHydrated is already true).
          await page.getByRole('link', { name: TITLE }).click();
          await page.waitForURL(/\/presentations\//);
          const range = page.locator('[data-zone]').first();
          await expect(range).toHaveAttribute('data-zone', 'local');
          await expect(range).toHaveText(zone.range);

          expect(errors).toEqual([]);
        }
      );
    });
  }
});

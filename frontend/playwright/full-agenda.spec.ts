import { test, expect } from '@playwright/test';

// The agenda draws two kinds of entry: accepted submissions from the database,
// which link to a session page, and the fixed schedule items in
// src/app/agendaExtras.ts, which have no session page and must not be links.
// Both come from the 2026 seed data (supabase/seeds/seed.sql).
const SEEDED_SESSION = 'Regex Field Notes';
const SEEDED_EXTRA = 'Welcome to the GLA Summit!';

// Seeded to run against each other, plus a static NI Expert Bar entry over the
// same hour: a three-column time block.
const PARALLEL_AT_1600 = [
  'Parallel Track A',
  'Parallel Track B',
  'NI Expert AMA - LabVIEW & Community'
];

test.describe('Agenda', () => {
  test(
    '/agenda redirects to the agenda page',
    { tag: '@smoke' },
    async ({ page }) => {
      const response = await page.goto('/agenda');
      expect(response?.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe('/full-agenda');
    }
  );

  test(
    'shows sessions as links and schedule-only entries as plain blocks',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/full-agenda');
      await page.waitForSelector('#presentations [title]');

      const session = page
        .getByTitle(new RegExp(`^${SEEDED_SESSION}\\.`))
        .first();
      await expect(session).toBeVisible();
      await expect(session).toHaveJSProperty('tagName', 'A');

      const extra = page.getByTitle(new RegExp(`^${SEEDED_EXTRA}\\.`)).first();
      await expect(extra).toBeVisible();
      // Not a link, and not reachable by tab: there is no page to go to.
      await expect(extra).toHaveJSProperty('tagName', 'DIV');
      await expect(extra).toHaveAttribute('title', /Stage/);
    }
  );

  test(
    'switches between timeline and list',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/full-agenda');
      await page.waitForSelector('#presentations');

      const timelineButton = page.getByRole('button', { name: 'Timeline' });
      const listButton = page.getByRole('button', { name: 'List' });

      // Desktop viewport, so the timeline is the default.
      await expect(timelineButton).toHaveAttribute('aria-pressed', 'true');

      await listButton.click();
      await expect(listButton).toHaveAttribute('aria-pressed', 'true');
      await expect(
        page.getByRole('link', { name: SEEDED_SESSION })
      ).toBeVisible();

      await timelineButton.click();
      await expect(timelineButton).toHaveAttribute('aria-pressed', 'true');
    }
  );

  test(
    'scrolls the page rather than a container of its own',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/full-agenda');
      await page.waitForSelector('#presentations [title]');

      // A scrollbar inside the agenda fighting the page scrollbar should be avoided
      const nestedScrollers = await page.evaluate(
        () =>
          [...document.querySelectorAll('#presentations *')].filter((el) => {
            const { overflowY, overflowX } = getComputedStyle(el);
            return (
              (['auto', 'scroll'].includes(overflowY) &&
                el.scrollHeight > el.clientHeight + 2) ||
              (['auto', 'scroll'].includes(overflowX) &&
                el.scrollWidth > el.clientWidth + 2)
            );
          }).length
      );
      expect(nestedScrollers).toBe(0);

      const overflows = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
      );
      expect(overflows).toBe(false);
    }
  );

  test(
    'lays parallel sessions out as equal, gapless columns',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/full-agenda');
      // Wait for the specific blocks this test measures, not just for the
      // agenda container: the page streams the agenda in behind a Suspense
      // boundary.
      for (const title of PARALLEL_AT_1600) {
        await expect(
          page.locator(`#presentations [title^="${title}."]`)
        ).toHaveCount(1);
      }

      // The seed schedules "Parallel Track A"/"B" against each other and against
      // an NI Expert Bar entry, making a three-column time block.
      const boxes = await page.evaluate(() =>
        [
          'Parallel Track A',
          'Parallel Track B',
          'NI Expert AMA - LabVIEW & Community'
        ].map((title) => {
          const el = document.querySelector<HTMLElement>(
            `#presentations [title^="${title}."]`
          );
          if (!el) return null;
          const { left, width } = el.getBoundingClientRect();
          return { left: Math.round(left), width: Math.round(width) };
        })
      );

      expect(boxes.every((b) => b !== null)).toBe(true);
      const found = boxes as { left: number; width: number }[];

      // Columns are sized in percentages, which the browser rounds to whole
      // pixels, so allow a pixel either way. The bug this guards against split
      // a time block into mismatched widths tens of pixels apart.
      const TOLERANCE_PX = 1.5;

      // One column count for the whole time block: every entry is the same width.
      for (const box of found) {
        expect(Math.abs(box.width - found[0].width)).toBeLessThanOrEqual(
          TOLERANCE_PX
        );
      }

      // And the columns abut exactly — no gaps, no overlaps.
      const sorted = [...found].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i += 1) {
        const previousRight = sorted[i - 1].left + sorted[i - 1].width;
        expect(Math.abs(sorted[i].left - previousRight)).toBeLessThanOrEqual(
          TOLERANCE_PX
        );
      }
    }
  );
});

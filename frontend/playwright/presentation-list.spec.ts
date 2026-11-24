import { test, expect } from '@playwright/test';

test.describe('Presentation-list tests', () => {
  // Visual regression: capture the full page and diff future runs against
  // this baseline. Playwright disables CSS animations/transitions and waits for
  // the page to stabilise before capturing, so the screenshot is deterministic.
  // The small maxDiffPixelRatio tolerates sub-pixel antialiasing/font-rendering
  // noise without masking genuine layout changes.
  test(
    'presentation list matches the visual baseline',
    { tag: '@regression' },
    async ({ page }) => {
      await page.goto('/presentation-list/2024');
      // Capture the post-hydration (viewer-local) timestamps, not whichever
      // phase happens to be on screen. The viewer zone is pinned to UTC in
      // playwright.config.ts; timezone behaviour itself is covered by
      // timestamps.spec.ts, so the baseline doesn't need to tolerate it.
      await expect(page.locator('[data-zone]').first()).toHaveAttribute(
        'data-zone',
        'local'
      );
      await expect(page).toHaveScreenshot('presentation-list.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });
    }
  );
});

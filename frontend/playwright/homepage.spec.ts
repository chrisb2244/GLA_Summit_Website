import { test, expect } from '@playwright/test';

test.describe('Homepage tests', () => {
  test('GLA homepage has title with GLA Summit', { tag: ['@smoke', '@synthetic'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GLA Summit/);
  });

  test('GLA homepage has link to ni.com', async ({ page }) => {
    await page.goto('/');
    const niText = page.locator('text=Sponsored by NI');

    await niText.click();
    await expect(page).toHaveURL(/https:\/\/www.ni.com\/.*/);
  });

  // Visual regression: capture the full homepage and diff future runs against
  // this baseline. Playwright disables CSS animations/transitions and waits for
  // the page to stabilise before capturing, so the screenshot is deterministic.
  // The small maxDiffPixelRatio tolerates sub-pixel antialiasing/font-rendering
  // noise without masking genuine layout changes. First run writes the baseline
  // (homepage-chromium-linux.png etc.); subsequent runs compare against it.
  test(
    'homepage matches the visual baseline',
    { tag: '@regression' },
    async ({ page }) => {
      await page.goto('/');
      // Ensure the hero/sponsor content has painted before capturing.
      await expect(page).toHaveTitle(/GLA Summit/);
      await expect(page.locator('text=Sponsored by NI')).toBeVisible();
      await expect(page).toHaveScreenshot('homepage.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02
      });
    }
  );

  // The following test is skipped because the "Our Team" link was removed from the homepage
  test.skip('Clicking "our team" link navigates to the our-team page', async ({
    page
  }) => {
    await page.goto('/');
    const our_team_button = page.locator('role=menuitem[name="Our Team"]');

    await our_team_button.click();
    await expect(page).toHaveURL(/.*\/our\-team/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Homepage tests', () => {
  test('GLA homepage has title with GLA Summit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GLA Summit/);
  });

  test('GLA homepage has link to ni.com', async ({ page }) => {
    await page.goto('/');
    const niText = page.locator('text=Sponsored by NI');

    await niText.click();
    await expect(page).toHaveURL(/https:\/\/www.ni.com\/.*/);
  });

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

import { test, expect } from '@playwright/test';

test('A login popup appears when browsing to submit-presentation without being logged in', async ({
  page
}) => {
  test.skip();
  // await page.goto('/submit-presentation');
  // const loginPopup = page.locator('role=dialog');

  // await expect(loginPopup).toBeVisible();
});

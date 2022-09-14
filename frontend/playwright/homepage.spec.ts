import { test, expect } from '@playwright/test';

test('GLA homepage has title with GLA Summit', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GLA Summit/)
});

test('GLA homepage has link to ni.com', async ({page}) => {
  await page.goto('/');
  const niText = page.locator("text=Sponsored by NI");
  
  await niText.click();
  await expect(page).toHaveURL(/https:\/\/www.ni.com\/.*/);
});
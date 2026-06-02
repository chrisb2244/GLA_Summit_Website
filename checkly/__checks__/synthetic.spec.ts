import { test, expect } from '@playwright/test';

// Self-contained synthetic check for production. Read-only: navigate + assert.
// Checkly injects ENVIRONMENT_URL when running against a specific environment;
// otherwise default to the live site.
const baseUrl = process.env.ENVIRONMENT_URL ?? 'https://glasummit.org';

test('homepage loads with correct title', async ({ page }) => {
  const response = await page.goto(baseUrl);
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/GLA Summit/);
});

test('presenter images route through /_next/image', async ({ page }) => {
  // Mirrors the repo's @synthetic image-cdn check: presenter avatars must be
  // served via the Next image optimizer, never as bare Supabase URLs. Soft-pass
  // when the page has no presenter images so the monitor never false-alarms.
  await page.goto(`${baseUrl}/presenters`);
  await page.waitForLoadState('networkidle');

  const presenterImages = page.locator('img[alt^="Image of"]');
  const count = await presenterImages.count();
  for (let i = 0; i < count; i++) {
    const src = await presenterImages.nth(i).getAttribute('src');
    expect(src, `presenter image [${i}] should use /_next/image`).toMatch(
      /^\/_next\/image\?url=/
    );
  }
});

import { test, expect } from '@playwright/test';

/**
 * Verifies that the OG image endpoint and social sharing metadata are correctly
 * configured for Twitter/X and LinkedIn link previews.
 *
 * Platform image requirements (for reference):
 *  - Twitter/X summary_large_image: 1200×628 recommended (1.91:1 ratio), 5 MB max
 *    https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image
 *  - LinkedIn: 1200×627 recommended, OG tags only, JPG/PNG only
 *    https://www.linkedin.com/help/linkedin/answer/a521928
 *  - Facebook/OG standard: 1200×630, < 5 MB
 *    https://ogp.me/
 *
 * The image generated at /api/og is 1200×630 which satisfies all three platforms.
 */

test.describe('OG image endpoint', () => {
  test('GET /api/og/[year] returns a PNG image with status 200', async ({ request }) => {
    const response = await request.get('/api/og/2026');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('image/png');
  });

  test('non-pre-rendered year returns 404', async ({ request }) => {
    const response = await request.get('/api/og/1999');
    expect(response.status()).toBe(404);
  });
});

test.describe('Social sharing metadata on homepage', () => {
  test('page has og:image meta tag pointing to /api/og', async ({ page }) => {
    await page.goto('/');
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toMatch(/\/api\/og\//);
  });

  test('og:image has correct 1200×630 dimensions declared', async ({ page }) => {
    await page.goto('/');
    const width = await page
      .locator('meta[property="og:image:width"]')
      .getAttribute('content');
    const height = await page
      .locator('meta[property="og:image:height"]')
      .getAttribute('content');
    expect(width).toBe('1200');
    expect(height).toBe('630');
  });

  test('page has twitter:card set to summary_large_image', async ({ page }) => {
    await page.goto('/');
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
  });

  test('page has twitter:image meta tag pointing to /api/og', async ({ page }) => {
    await page.goto('/');
    const twitterImage = await page
      .locator('meta[name="twitter:image"]')
      .getAttribute('content');
    expect(twitterImage).toMatch(/\/api\/og\//);
  });

  test('og:image URL resolves to an actual image', async ({ page, request }) => {
    await page.goto('/');
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toBeTruthy();
    const response = await request.get(ogImage!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });
});

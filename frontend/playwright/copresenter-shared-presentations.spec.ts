import { test, expect } from '@playwright/test';
import { createAttendee, loginOnPage, seedSharedPresentation } from './utils';
import type { SeededUser } from './utils';
import { submissionsForYear } from '@/app/configConstants';

const buildSharedTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

test.describe('copresenter shared presentation visibility and status', () => {
  // Both participants start as plain attendees; the shared presentation that
  // makes one of them a co-presenter is the fixture under test, seeded by admin.
  let submitter: SeededUser;
  let copresenter: SeededUser;

  test.beforeEach(async () => {
    [submitter, copresenter] = await Promise.all([
      createAttendee({ emailPrefix: 'pw-shared-submitter' }),
      createAttendee({ emailPrefix: 'pw-shared-copresenter' })
    ]);
  });

  test.afterEach(async () => {
    // Deleting the submitter cascades the shared submission + presenter links.
    await submitter?.cleanup();
    await copresenter?.cleanup();
  });

  test('copresenter sees shared presentation in my-presentations', async ({
    page
  }) => {
    const title = buildSharedTitle('Shared visibility');
    await seedSharedPresentation({
      title,
      year: submissionsForYear,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      status: 'awaiting-response'
    });

    await page.goto('/');
    await loginOnPage(page, copresenter.email);
    await page.goto('/my-presentations');
    await expect(
      page.getByRole('link', { name: title, exact: true })
    ).toBeVisible();
  });

  test('copresenter sees accepted status for shared presentation', async ({
    page
  }) => {
    const title = buildSharedTitle('Shared accepted status');
    await seedSharedPresentation({
      title,
      year: submissionsForYear,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      status: 'accepted'
    });

    await page.goto('/');
    await loginOnPage(page, copresenter.email);
    await page.goto('/my-presentations');
    const card = page.locator(`div[aria-label="${title}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByText('Accepted', { exact: true })).toBeVisible();
  });

  test('copresenter sees under consideration status for shared presentation', async ({
    page
  }) => {
    const title = buildSharedTitle('Shared awaiting status');
    await seedSharedPresentation({
      title,
      year: submissionsForYear,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      status: 'awaiting-response'
    });

    await page.goto('/');
    await loginOnPage(page, copresenter.email);
    await page.goto('/my-presentations');
    const card = page.locator(`div[aria-label="${title}"]`);
    await expect(card).toBeVisible();
    await expect(
      card.getByText('Under consideration', { exact: true })
    ).toBeVisible();
  });

  test('submitter and copresenter both see the same shared title', async ({
    browser
  }) => {
    const title = buildSharedTitle('Shared title parity');
    await seedSharedPresentation({
      title,
      year: submissionsForYear,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      status: 'awaiting-response'
    });

    const submitterContext = await browser.newContext();
    const copresenterContext = await browser.newContext();
    const submitterPage = await submitterContext.newPage();
    const copresenterPage = await copresenterContext.newPage();

    try {
      await submitterPage.goto('/');
      await loginOnPage(submitterPage, submitter.email);
      await copresenterPage.goto('/');
      await loginOnPage(copresenterPage, copresenter.email);

      await submitterPage.goto('/my-presentations');
      await copresenterPage.goto('/my-presentations');

      await expect(
        submitterPage.getByRole('link', { name: title, exact: true })
      ).toBeVisible();
      await expect(
        copresenterPage.getByRole('link', { name: title, exact: true })
      ).toBeVisible();
    } finally {
      await submitterContext.close();
      await copresenterContext.close();
    }
  });

  test.skip(
    'copresenter can edit draft text fields title abstract learning points',
    async ({ page }) => {
      // Skipped intentionally: co-presenter draft edit capability is pending a product policy decision.
      const title = buildSharedTitle('Shared draft edit');
      await seedSharedPresentation({
        title,
        year: submissionsForYear,
        submitterId: submitter.userId,
        copresenterId: copresenter.userId,
        status: 'awaiting-response',
        isSubmitted: false
      });

      await page.goto('/');
      await loginOnPage(page, copresenter.email);
      await page.goto('/my-presentations');
      await page.getByRole('link', { name: title, exact: true }).click();
      await expect(page).toHaveURL(/\/my-presentations\/[^/]+\/edit$/);
    }
  );
});

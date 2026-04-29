import { test, expect } from '@playwright/test';
import path from 'path';
import { seedSharedPresentation } from './utils';

const submitterEmail = process.env.TEST_PRESENTER_EMAIL as string;
const copresenterEmail = process.env.TEST_ATTENDEE_EMAIL as string;

const buildSharedTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

const attendeeStorageState = path.resolve(__dirname, '.auth', 'attendee.json');
const presenterStorageState = path.resolve(__dirname, '.auth', 'presenter.json');

test.describe('copresenter shared presentation visibility and status', () => {
  test.use({ storageState: attendeeStorageState });

  test('copresenter sees shared presentation in my-presentations', async ({ page }) => {
    const title = buildSharedTitle('Shared visibility');
    const seeded = await seedSharedPresentation({
      title,
      submitterEmail,
      copresenterEmail,
      status: 'awaiting-response'
    });

    try {
      await page.goto('/my-presentations');
      await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test('copresenter sees accepted status for shared presentation', async ({ page }) => {
    const title = buildSharedTitle('Shared accepted status');
    const seeded = await seedSharedPresentation({
      title,
      submitterEmail,
      copresenterEmail,
      status: 'accepted'
    });

    try {
      await page.goto('/my-presentations');
      const card = page.locator(`div[aria-label="${title}"]`);
      await expect(card).toBeVisible();
      await expect(card.getByText('Accepted', { exact: true })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test('copresenter sees awaiting response status for shared presentation', async ({ page }) => {
    const title = buildSharedTitle('Shared awaiting status');
    const seeded = await seedSharedPresentation({
      title,
      submitterEmail,
      copresenterEmail,
      status: 'awaiting-response'
    });

    try {
      await page.goto('/my-presentations');
      const card = page.locator(`div[aria-label="${title}"]`);
      await expect(card).toBeVisible();
      await expect(card.getByText('Awaiting response', { exact: true })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });

  test('submitter and copresenter both see the same shared title', async ({ browser }) => {
    const title = buildSharedTitle('Shared title parity');
    const seeded = await seedSharedPresentation({
      title,
      submitterEmail,
      copresenterEmail,
      status: 'awaiting-response'
    });

    const submitterContext = await browser.newContext({
      storageState: presenterStorageState
    });
    const copresenterContext = await browser.newContext({
      storageState: attendeeStorageState
    });

    const submitterPage = await submitterContext.newPage();
    const copresenterPage = await copresenterContext.newPage();

    try {
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
      await seeded.cleanup();
    }
  });

  test.skip(
    'copresenter can edit draft text fields title abstract learning points',
    async ({ page }) => {
      // Skipped intentionally: co-presenter draft edit capability is pending a product policy decision.
      const title = buildSharedTitle('Shared draft edit');
      const seeded = await seedSharedPresentation({
        title,
        submitterEmail,
        copresenterEmail,
        status: 'awaiting-response',
        isSubmitted: false
      });

      try {
        await page.goto('/my-presentations');
        await page.getByRole('link', { name: title, exact: true }).click();
        await expect(page).toHaveURL(/\/my-presentations\/[^/]+\/edit$/);
      } finally {
        await seeded.cleanup();
      }
    }
  );
});

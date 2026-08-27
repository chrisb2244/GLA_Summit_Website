import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  countEmailsInInbox,
  createAttendee,
  createSupabaseAdmin,
  generateTestEmail,
  getLatestMessageForEmail,
  loginOnPage
} from './utils';
import type { SeededUser } from './utils';

// The confirmation code is ours, not GoTrue's, so the shared OTP helper (which
// keys off "one-time-passcode token is") does not apply. Read it straight out
// of the message the app sent.
const readConfirmationCode = async (
  email: string,
  timeoutMs = 15000
): Promise<string> => {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no message';
  while (Date.now() < deadline) {
    try {
      const message = await getLatestMessageForEmail(email);
      const code = (message.body.text ?? '').match(
        /confirmation code is ([0-9]{6})/i
      )?.[1];
      if (code) {
        return code;
      }
      lastError = 'message had no confirmation code';
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation code for ${email}: ${lastError}`);
};

const addressRow = (page: Page, email: string) =>
  page.getByRole('listitem').filter({ hasText: email });

// Scoped to the section: Next renders its own always-present role="alert"
// route announcer, which an unscoped getByRole('alert') also matches.
const sectionAlert = (page: Page) =>
  page.getByRole('region', { name: 'Email addresses' }).getByRole('alert');

test.describe('Account email addresses', () => {
  const users: SeededUser[] = [];

  test.afterAll(async () => {
    for (const user of users) {
      await user.cleanup();
    }
  });

  test('A user can add, promote, and remove a second address', async ({
    page
  }) => {
    const user = await createAttendee({ emailPrefix: 'pw-addresses' });
    users.push(user);
    const secondEmail = generateTestEmail('pw-second');

    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.goto('/my-profile');

    // --- Add -----------------------------------------------------------
    await page.getByLabel('New email address').fill(secondEmail);
    await page.getByRole('button', { name: /Send code/i }).click();

    await expect(page.getByLabel('Confirmation code')).toBeVisible();

    const code = await readConfirmationCode(secondEmail);
    await page.getByLabel('Confirmation code').fill(code);
    await page.getByRole('button', { name: /Confirm address/i }).click();

    await expect(addressRow(page, secondEmail)).toBeVisible();
    await expect(addressRow(page, user.email)).toContainText('Primary');

    // The address already on the account is told, so an addition made by
    // someone else is visible to its owner.
    const notice = await getLatestMessageForEmail(user.email);
    expect(notice.subject).toMatch(/address was added/i);

    // --- Promote -------------------------------------------------------
    await addressRow(page, secondEmail)
      .getByRole('button', { name: /Make primary/i })
      .click();

    await expect(addressRow(page, secondEmail)).toContainText('Primary');
    await expect(addressRow(page, user.email)).not.toContainText('Primary');

    // GoTrue must have moved with it: it is the authority for the address, and
    // the two drifting apart is the failure this feature exists to prevent.
    const admin = createSupabaseAdmin();
    const { data: authUser } = await admin.auth.admin.getUserById(user.userId);
    expect(authUser.user?.email).toBe(secondEmail);

    // --- Remove --------------------------------------------------------
    await addressRow(page, user.email)
      .getByRole('button', { name: /Remove/i })
      .click();

    await expect(addressRow(page, user.email)).toHaveCount(0);
    await expect(addressRow(page, secondEmail)).toBeVisible();
  });

  test('A second address can be added without reloading the page', async ({
    page
  }) => {
    const user = await createAttendee({ emailPrefix: 'pw-two-adds' });
    users.push(user);
    const firstAdded = generateTestEmail('pw-add-one');
    const secondAdded = generateTestEmail('pw-add-two');

    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.goto('/my-profile');

    for (const email of [firstAdded, secondAdded]) {
      await page.getByLabel('New email address').fill(email);
      await page.getByRole('button', { name: /Send code/i }).click();

      // The regression this guards: the form used to latch on the first
      // success, so the second request mailed a code with no field to type it
      // into.
      await expect(page.getByLabel('Confirmation code')).toBeVisible();

      await page.getByLabel('Confirmation code').fill(await readConfirmationCode(email));
      await page.getByRole('button', { name: /Confirm address/i }).click();

      await expect(addressRow(page, email)).toBeVisible();
    }

    await expect(addressRow(page, user.email)).toContainText('Primary');
  });

  test('An address already on another account is not disclosed', async ({
    page
  }) => {
    const user = await createAttendee({ emailPrefix: 'pw-addr-owner' });
    const other = await createAttendee({ emailPrefix: 'pw-addr-taken' });
    users.push(user, other);

    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.goto('/my-profile');

    await page.getByLabel('New email address').fill(other.email);
    await page.getByRole('button', { name: /Send code/i }).click();

    // Same screen as a genuine send: were the code form absent here, its
    // absence would be the answer to "does this address have an account?".
    await expect(page.getByLabel('Confirmation code')).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Email addresses' })
    ).toContainText(/a confirmation code is on its way/i);

    // Nothing was actually sent, so the other email is not pestered...
    expect(await countEmailsInInbox(other.email)).toBe(0);

    // ...and no code can complete the addition.
    await page.getByLabel('Confirmation code').fill('000000');
    await page.getByRole('button', { name: /Confirm address/i }).click();

    await expect(sectionAlert(page)).toContainText(/not right/i);
    await expect(addressRow(page, other.email)).toHaveCount(0);
  });

  test('A wrong code does not add the address', async ({ page }) => {
    const user = await createAttendee({ emailPrefix: 'pw-addr-badcode' });
    users.push(user);
    const secondEmail = generateTestEmail('pw-badcode');

    await page.goto('/');
    await loginOnPage(page, user.email);
    await page.goto('/my-profile');

    await page.getByLabel('New email address').fill(secondEmail);
    await page.getByRole('button', { name: /Send code/i }).click();

    await expect(page.getByLabel('Confirmation code')).toBeVisible();
    await page.getByLabel('Confirmation code').fill('000000');
    await page.getByRole('button', { name: /Confirm address/i }).click();

    await expect(sectionAlert(page)).toContainText(/not right/i);
    await expect(addressRow(page, secondEmail)).toHaveCount(0);
  });
});

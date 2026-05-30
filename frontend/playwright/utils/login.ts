import { Page } from '@playwright/test';
import { LoginablePage } from '../models/LoginablePage';
import { getInbucketVerificationCode } from './email';

type LoginOnPageOptions = {
  expectedPath?: string | RegExp;
  redirectTimeoutMs?: number;
};

export const loginOnPage = async (
  page: Page,
  email: string,
  options?: LoginOnPageOptions
) => {
  const loginablePage = new LoginablePage(page);
  await loginablePage.openLoginOrRegisterForm('login');
  await loginablePage.fillInLoginForm(email);
  await loginablePage
    .submitForm()
    // Delay to allow the email to be sent - old emails exist for existing accounts
    .then(() => new Promise((resolve) => setTimeout(resolve, 300)));

  const otp = await getInbucketVerificationCode(email, 5000, 3000);
  await loginablePage.fillInVerificationForm(otp);
  await loginablePage.submitForm();

  // Assert the user menu button is populated
  const userButton = page.locator('[data-testid="user-menu-button"]');
  await userButton.waitFor({ state: 'visible', timeout: 20000 });

  // For redirect-sensitive tests, wait until the expected destination route settles.
  // domcontentloaded (not 'load') avoids blocking on streaming Suspense boundaries.
  if (options?.expectedPath !== undefined) {
    await page.waitForURL(options.expectedPath, {
      timeout: options.redirectTimeoutMs ?? 15000,
      waitUntil: 'domcontentloaded'
    });
  }
};

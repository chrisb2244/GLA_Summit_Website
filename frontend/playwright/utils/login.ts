import { Page } from '@playwright/test';
import { LoginablePage } from '../models/LoginablePage';
import { getInbucketVerificationCode } from './email';

type LoginOnPageOptions = {
  expectedPath?: string | RegExp;
  redirectTimeoutMs?: number;
};

// Supabase can reject an otherwise-correct OTP transiently — most often when a
// burst of concurrent logins (fullyParallel) throttles the remote Auth endpoint
// or the code is verified a beat before it has committed on the remote DB. A
// single login generates exactly one OTP email, so re-reading the inbox would
// only hand back the same code; instead we resubmit that same code once after a
// short pause. submitVerificationCode returns the outcome immediately (it does
// not wait out a success timeout), so a genuine failure surfaces in seconds.
const submitVerificationCodeWithRetry = async (
  loginablePage: LoginablePage,
  email: string,
  maxAttempts = 2
) => {
  const otp = await getInbucketVerificationCode(email, 15000, 3000);
  let lastMessage = 'unknown error';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await loginablePage.submitVerificationCode(otp);
    if (result.ok) {
      return;
    }
    lastMessage = result.message;
    // Give a transient throttle / read-after-write lag time to clear before the
    // final attempt.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `Verification code rejected after ${maxAttempts} attempts: ${lastMessage}`
  );
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

  await submitVerificationCodeWithRetry(loginablePage, email);

  // Assert the user menu button is populated. This is near-instant on success
  // (the redirect has already fired); the generous timeout only covers the
  // authenticated layout streaming in.
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

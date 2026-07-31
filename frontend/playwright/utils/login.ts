import { Page } from '@playwright/test';
import { LoginablePage } from '../models/LoginablePage';
import { createSupabaseAdmin } from './supabaseAdmin';

type LoginOnPageOptions = {
  expectedPath?: string | RegExp;
  redirectTimeoutMs?: number;
};

// The app's sign-in server action mints its OTP with auth.admin.generateLink
// and emails it (authService.signIn). Tests skip the email round-trip: mint a
// fresh magiclink token for the same user via the admin API and type its
// email_otp into the real verification form. GoTrue keeps only the newest
// token per user, so the test-minted code supersedes the emailed one; the
// email is still sent, nothing reads the inbox. The genuine email round-trip
// stays covered by user-login.spec.ts, which drives the inbox path on purpose.
const mintOtpCode = async (email: string): Promise<string> => {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email
  });
  const otp = data?.properties?.email_otp;
  if (error || !otp) {
    throw new Error(
      `Failed to mint OTP for ${email}: ${error?.message ?? 'no email_otp returned'}`
    );
  }
  return otp;
};

// Two failure modes are retried here, both transient:
//  - the app's own generateLink (fired by the login form submit) landed AFTER
//    ours, superseding our token — re-minting makes ours newest again;
//  - Supabase rejects a correct OTP a beat before it has committed (seen under
//    fullyParallel bursts against the remote Auth endpoint).
// submitVerificationCode returns the outcome immediately (it does not wait out
// a success timeout), so a genuine failure surfaces in seconds.
const submitVerificationCodeWithRetry = async (
  loginablePage: LoginablePage,
  email: string,
  maxAttempts = 2
) => {
  let lastMessage = 'unknown error';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const otp = await mintOtpCode(email);
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
  await loginablePage.submitForm();

  // The form navigates here once the sign-in server action resolves, i.e. the
  // app has minted (and mailed) ITS token. Minting ours after that keeps ours
  // the newest — the retry above covers the rare case where they still race.
  await page.waitForURL(/\/auth\/validateLogin/);

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

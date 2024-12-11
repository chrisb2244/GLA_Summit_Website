import { test as setup, expect, Page } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import { getInbucketVerificationCode } from './utils';
import path from 'path';

const authFolder = path.join(__dirname, '.auth');
const adminFile = `${authFolder}/admin.json`;
setup('authenticate as administrator', async ({ page }) => {
  // Sign in as an admin user
  await signInWithEmail(page, process.env.TEST_ADMIN_EMAIL);
  await page.context().storageState({ path: adminFile });
});

const organizerFile = `${authFolder}/organizer.json`;
setup('authenticate as organizer', async ({ page }) => {
  // Sign in as an organizer user
  await signInWithEmail(page, process.env.TEST_ORGANIZER_EMAIL);
  await page.context().storageState({ path: organizerFile });
});

const presenterFile = `${authFolder}/presenter.json`;
setup('authenticate as presenter', async ({ page }) => {
  // Sign in as a presenter user
  await signInWithEmail(page, process.env.TEST_PRESENTER_EMAIL);
  await page.context().storageState({ path: presenterFile });
});

const attendeeFile = `${authFolder}/attendee.json`;
setup('authenticate as attendee', async ({ page }) => {
  // Sign in as a user
  await signInWithEmail(page, process.env.TEST_ATTENDEE_EMAIL);
  await page.context().storageState({ path: attendeeFile });
});

const signInWithEmail = async (page: Page, email?: string) => {
  if (!email) {
    throw new Error('Email must be provided to sign in');
  }

  await page.goto('/');
  const loginablePage = new LoginablePage(page);
  await loginablePage.openLoginOrRegisterForm('login');
  await loginablePage.fillInLoginForm(email);
  await loginablePage
    .submitForm()
    // Delay to allow the email to be sent - old emails exist for existing accounts
    .then(() => new Promise((resolve) => setTimeout(resolve, 1000)));

  const otp = await getInbucketVerificationCode(email, 5000, 5000);
  expect(otp).toBeDefined();

  await loginablePage.fillInVerificationForm(otp);
  await loginablePage.submitForm();

  // Assert the user menu button is populated
  const userButton = page.getByTestId('user-menu-button');
  await userButton.waitFor({ state: 'visible', timeout: 10000 });
};

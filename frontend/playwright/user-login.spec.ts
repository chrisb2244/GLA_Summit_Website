import { test, expect } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import {
  countEmailsInInbox,
  createSupabaseAdmin,
  generateTestEmail,
  getInbucketVerificationCode
} from './utils';

test.describe('User Authentication Tests', () => {
  const emailsToDelete: string[] = [];

  const generateUser = (firstname: string, lastname: string) => ({
    firstname,
    lastname,
    email: generateTestEmail('test')
  });
  const supabaseAdmin = createSupabaseAdmin();

  test.afterAll(async () => {
    for (const email of emailsToDelete) {
      const { data, error } = await supabaseAdmin
        .from('account_emails')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (error || data?.user_id == null) {
        continue;
      }

      await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    }
  });

  test('User can register', async ({ page }) => {
    // Generated per-test (not at module scope) so --repeat-each runs each get a
    // fresh email; reusing one address re-registers an existing account and the
    // resent code no longer matches, breaking verification on the second repeat.
    const newUser = generateUser('New', 'User');

    await page.goto('/');
    const loginablePage = new LoginablePage(page);
    await loginablePage.openLoginOrRegisterForm('register');

    emailsToDelete.push(newUser.email);
    await loginablePage.fillInRegistrationForm(newUser);
    await loginablePage.submitForm();

    const otp = await getInbucketVerificationCode(newUser.email, 15000);
    expect(otp).toBeDefined();

    await loginablePage.fillInVerificationForm(otp);
    await loginablePage.submitForm();

    // Assert the user menu button is populated
    const userButton = page.locator('role=button', {
      hasText: /New User/
    });
    await userButton.waitFor({ state: 'visible', timeout: 10000 });

    await expect(userButton).toBeVisible();
  });

  test('Existing user can login', { tag: '@smoke' }, async ({ page }) => {
    // Generated per-test (not at module scope) so each --repeat-each run gets a
    // distinct account and they don't race over a shared inbox / OTP.
    const existingUser = generateUser('Existing', 'User');

    // Setup a user for login tests
    // console.log('Creating user with email: ', precreatedUser.email);
    emailsToDelete.push(existingUser.email);
    await supabaseAdmin.auth.admin.createUser({
      email: existingUser.email,
      password: 'password',
      user_metadata: {
        firstname: existingUser.firstname,
        lastname: existingUser.lastname
      }
    });

    await page.goto('/');

    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('login');
    await loginablePage.fillInLoginForm(existingUser.email);
    await loginablePage.submitForm();

    const otp = await getInbucketVerificationCode(existingUser.email, 15000);
    expect(otp).toBeDefined();

    await loginablePage.fillInVerificationForm(otp);
    await loginablePage.submitForm();

    // Assert the user menu button is populated
    const userButton = page.locator('role=button', {
      hasText: /Existing User/
    });
    await userButton.waitFor({ state: 'visible', timeout: 10000 });

    await expect(userButton).toBeVisible();
  });

  test('Email entry gains focus when navigating to login form', async ({
    page
  }) => {
    await page.goto('/');
    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('login');
    const emailInput = page.getByLabel('Email');

    await expect(emailInput).toBeFocused();
  });

  test('Name gains entry for registration form', async ({ page }) => {
    await page.goto('/');
    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('register');
    const firstNameInput = page.getByLabel('First Name');

    await expect(firstNameInput).toBeFocused();
  });

  test('Repeated clicking only sends one email - registration', async ({
    page
  }) => {
    await page.goto('/');
    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('register');
    const user = generateUser('Repeated', 'User');
    emailsToDelete.push(user.email);
    await loginablePage.fillInRegistrationForm(user);

    // Click submit multiple times
    await Promise.all([
      loginablePage.submitForm('enter key'),
      loginablePage.submitForm('button click'),
      loginablePage.submitForm()
    ]);

    // Wait for the OTP email to actually land before counting. Against
    // testmail.app, app→Mailgun→testmail delivery takes seconds, so the old
    // fixed 500ms snapshot raced delivery and counted 0. Block on the code
    // first (latency-tolerant livequery), then let any duplicate a broken
    // debounce would have sent settle, then assert exactly one arrived.
    const otp = await getInbucketVerificationCode(user.email, 15000);
    expect(otp).toBeDefined();

    await page.waitForTimeout(2000);
    const numEmailsInBucket = await countEmailsInInbox(user.email);
    expect(numEmailsInBucket).toBe(1);

    await loginablePage.fillInVerificationForm(otp);
    await loginablePage.submitForm();

    // Assert the user menu button is populated
    const userButton = page.locator('role=button', {
      hasText: `${user.firstname} ${user.lastname}`
    });
    await userButton.waitFor({ state: 'visible', timeout: 10000 });

    await expect(userButton).toBeVisible();
  });

  test('Sign-in with an unregistered address offers registration', async ({
    page
  }) => {
    // No user is created for this address: this is the failure that fills the
    // logs, and the response must not reveal that the account is missing.
    const email = generateTestEmail('unregistered');

    await page.goto('/auth/login?redirectTo=/ticket');
    const loginForm = page.getByRole('form', { name: 'Login Form' });
    await loginForm.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: /log in/i }).click();

    const formError = loginForm.getByRole('alert');
    await expect(formError).toContainText(/couldn't send a login code/i);
    await expect(page).toHaveURL(/\/auth\/login/);

    // The typed address (and redirectTo) survive the switch to registration.
    await formError.getByRole('link', { name: /Create an account/i }).click();
    await expect(
      page.getByRole('form', { name: 'Registration Form' }).getByLabel('Email')
    ).toHaveValue(email);
    await expect(page).toHaveURL(/redirectTo=%2Fticket/);

    // Recorded as 'info' under its own source, so 'error' rows stay meaningful.
    const { data } = await supabaseAdmin
      .from('log')
      .select('severity,context')
      .eq('source', 'auth/signin-no-account')
      .order('created_at', { ascending: false })
      .limit(10);

    const row = data?.find(
      (entry) => (entry.context as { email?: string } | null)?.email === email
    );
    expect(row?.severity).toBe('info');
  });

  test('Repeated clicking only sends one email - login', async ({ page }) => {
    // Setup a user for login tests
    const user = generateUser('FastClicking', 'User');
    emailsToDelete.push(user.email);
    await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: 'password',
      user_metadata: {
        firstname: user.firstname,
        lastname: user.lastname
      }
    });

    await page.goto('/');
    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('login');
    await loginablePage.fillInLoginForm(user.email);

    // Click submit multiple times
    const attempts = [
      loginablePage.submitForm('button click'),
      loginablePage.submitForm('enter key'),
      loginablePage.submitForm()
    ];

    await Promise.allSettled(attempts);

    // Wait for the OTP email to actually land before counting. testmail.app
    // delivery (app→Mailgun→testmail) takes seconds, so a fixed 500ms snapshot
    // races delivery and counts 0. Block on the code first (latency-tolerant
    // livequery), let any duplicate settle, then assert exactly one arrived.
    const otp = await getInbucketVerificationCode(user.email, 15000);
    expect(otp).toBeDefined();

    await page.waitForTimeout(2000);
    const numEmailsInBucket = await countEmailsInInbox(user.email);
    expect(numEmailsInBucket).toBe(1);

    await loginablePage.fillInVerificationForm(otp);
    await loginablePage.submitForm();

    // Assert the user menu button is populated
    const userButton = page.locator('role=button', {
      hasText: `${user.firstname} ${user.lastname}`
    });
    await userButton.waitFor({ state: 'visible', timeout: 10000 });

    await expect(userButton).toBeVisible();
  });

  test('Enter key triggers correct behaviour for login form', async ({
    page
  }) => {
    const loginablePage = new LoginablePage(page);
    await loginablePage.goto('/');

    await loginablePage.openLoginOrRegisterForm('login');
    expect(await loginablePage.isLoginForm()).toBeTruthy();

    const loginForm = page.getByRole('form', { name: 'Login Form' });
    const emailInput = loginForm.getByLabel('Email');
    await emailInput.fill('notavalidemail.com');
    await emailInput.blur();

    await expect(loginForm.getByRole('alert')).toHaveCount(1);
  });

  test('Registration form displays errors correctly', async ({ page }) => {
    const loginablePage = new LoginablePage(page);
    await loginablePage.goto('/');

    await loginablePage.openLoginOrRegisterForm('register');
    expect(await loginablePage.isRegistrationForm()).toBeTruthy();

    const registrationForm = page.getByRole('form', {
      name: 'Registration Form'
    });
    await registrationForm.getByLabel('First Name').fill('');
    await registrationForm.getByLabel('Last Name').fill('');
    await registrationForm.getByLabel('Email').fill('notavalidemail.com');
    await registrationForm.getByLabel('First Name').blur();
    await registrationForm.getByLabel('Last Name').blur();
    await registrationForm.getByLabel('Email').blur();

    await loginablePage.submitForm('button click');

    await expect(registrationForm.getByRole('alert')).toHaveCount(3);
  });

  // Skip this test - it's unclear if we want this behaviour or not.
  // If we decide against it, then we can update the test to check that the back
  // button returns to the previous non-login page.
  test.skip('Switch to registration form and use browser back button', async ({
    page
  }) => {
    await page.goto('/');
    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('login');
    expect(await loginablePage.isLoginForm()).toBeTruthy();

    await page.getByRole('link', { name: /Join Now/i }).click();

    const waitForCondition = async (
      fn: () => Promise<boolean>,
      timeout: number
    ) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await fn()) {
          break;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    };

    await waitForCondition(() => loginablePage.isRegistrationForm(), 2000);
    expect(await loginablePage.isRegistrationForm()).toBeTruthy();

    await page.goBack();
    await waitForCondition(() => loginablePage.isLoginForm(), 2000);
    expect(await loginablePage.isLoginForm()).toBeTruthy();
  });

  test.fixme(
    'Error state resets to empty when closing and reopening',
    async ({ page }) => {
      const loginablePage = new LoginablePage(page);
      await loginablePage.goto('/');

      await loginablePage.openLoginOrRegisterForm('register');
      // initially, no errors
      expect(await loginablePage.getAllErrors()).toHaveLength(0);

      await loginablePage.fillInRegistrationForm({
        firstname: '',
        lastname: '',
        email: 'notavalidemail.com'
      });

      await loginablePage.submitForm();
      const errors = await loginablePage.getAllErrors();
      expect(errors).toHaveLength(3);

      // await loginablePage.closeDialogByClickingOutside();
      // expect(await loginablePage.hasOpenDialog()).toBeFalsy();

      // repeat process, expect initial errors 0
      await loginablePage.openLoginOrRegisterForm('register');
      expect(await loginablePage.getAllErrors()).toHaveLength(0);
    }
  );
});

import { test, expect } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import {
  countEmailsInInbox,
  createSupabaseAdmin,
  getInbucketVerificationCode
} from './utils';

test.describe('User Authentication Tests', () => {
  const emailsToDelete: string[] = [];

  const generateUser = (firstname: string, lastname: string) => {
    const emailWithoutDomain = `test-${Math.random()
      .toString(36)
      .substring(2)}`;
    return {
      firstname,
      lastname,
      email: `${emailWithoutDomain}@test.email`
    };
  };
  const newUser = generateUser('New', 'User');
  const existingUser = generateUser('Existing', 'User');

  const supabaseAdmin = createSupabaseAdmin();

  test.afterAll(async () => {
    // Cleanup all users created (beforeAll, and can register test)

    for (const email of emailsToDelete) {
      // delete user
      // console.log('Searching for user (to delete) with email: ', email);
      await supabaseAdmin
        .from('email_lookup')
        .select('id')
        .eq('email', email)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // May not have created the user (e.g. partial tests run)
            return;
          }
          // console.log('Deleting user with id: ', data.id);
          supabaseAdmin.auth.admin.deleteUser(data.id);
        });
    }
  });

  test('User can register', async ({ page }) => {
    await page.goto('/');
    const loginablePage = new LoginablePage(page);
    await loginablePage.openLoginOrRegisterForm('register');

    emailsToDelete.push(newUser.email);
    await loginablePage.fillInRegistrationForm(newUser);
    await loginablePage.submitForm();

    const otp = await getInbucketVerificationCode(newUser.email, 5000);
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

  test('Existing user can login', async ({ page }) => {
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

    const otp = await getInbucketVerificationCode(existingUser.email, 5000);
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
    ]).then(() => new Promise((r) => setTimeout(r, 500)));

    const numEmailsInBucket = await countEmailsInInbox(user.email);
    expect(numEmailsInBucket).toBe(1);

    const otp = await getInbucketVerificationCode(user.email, 1000);
    expect(otp).toBeDefined();

    await loginablePage.fillInVerificationForm(otp);
    await loginablePage.submitForm();

    // Assert the user menu button is populated
    const userButton = page.locator('role=button', {
      hasText: `${user.firstname} ${user.lastname}`
    });
    await userButton.waitFor({ state: 'visible', timeout: 10000 });

    await expect(userButton).toBeVisible();
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
    await Promise.all([
      loginablePage.submitForm('button click'),
      loginablePage.submitForm('enter key'),
      loginablePage.submitForm()
    ]).then(() => new Promise((r) => setTimeout(r, 500)));

    const numEmailsInBucket = await countEmailsInInbox(user.email);
    expect(numEmailsInBucket).toBe(1);

    const otp = await getInbucketVerificationCode(user.email, 2000);
    expect(otp).toBeDefined();

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

    await loginablePage.fillInLoginForm('notavalidemail.com');
    // Attempt to submit by hitting enter
    await loginablePage.submitForm('enter key');
    // Should not be able to login (i.e. dialog remains open)
    // expect(await loginablePage.hasOpenDialog()).toBeTruthy();
    const errors = await loginablePage.getAllErrors();
    expect(errors).toHaveLength(1);
  });

  test('Registration form displays errors correctly', async ({ page }) => {
    const loginablePage = new LoginablePage(page);
    await loginablePage.goto('/');

    await loginablePage.openLoginOrRegisterForm('register');
    expect(await loginablePage.isRegistrationForm()).toBeTruthy();

    await loginablePage.fillInRegistrationForm({
      firstname: '',
      lastname: '',
      email: 'notavalidemail.com'
    });
    // Attempt to submit
    await loginablePage.submitForm('button click');
    // Should not be able to login (i.e. dialog remains open)
    // expect(await loginablePage.hasOpenDialog()).toBeTruthy();
    const errors = await loginablePage.getAllErrors();
    expect(errors).toHaveLength(3);
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

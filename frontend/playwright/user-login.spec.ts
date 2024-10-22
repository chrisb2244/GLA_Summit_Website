import { test, expect } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import { createSupabaseAdmin, getInbucketVerificationCode } from './utils';

test.describe('User Authentication Tests', () => {
  const generateUser = (firstname: string, lastname: string) => {
    const emailWithoutDomain = `test-${Math.random()
      .toString(36)
      .substring(2)}`;
    return {
      firstname,
      lastname,
      email: `${emailWithoutDomain}@test.email`,
      emailPrefix: emailWithoutDomain
    };
  };
  const newUser = generateUser('New', 'User');
  const existingUser = generateUser('Existing', 'User');

  const supabaseAdmin = createSupabaseAdmin();

  test.beforeAll(async () => {
    // Setup a user for login tests
    // console.log('Creating user with email: ', precreatedUser.email);
    await supabaseAdmin.auth.admin.createUser({
      email: existingUser.email,
      password: 'password',
      user_metadata: {
        firstname: existingUser.firstname,
        lastname: existingUser.lastname
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup all users created (beforeAll, and can register test)
    const emailsToDelete = [existingUser.email, newUser.email];

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
            console.error('Error deleting user: ', error);
            throw error;
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

    await loginablePage.fillInRegistrationForm(newUser);
    await loginablePage.submitForm();

    const otp = await getInbucketVerificationCode(newUser.emailPrefix, 5000);
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
    await page.goto('/');

    const loginablePage = new LoginablePage(page);

    await loginablePage.openLoginOrRegisterForm('login');
    await loginablePage.fillInLoginForm(existingUser.email);
    await loginablePage.submitForm();

    const otp = await getInbucketVerificationCode(
      existingUser.emailPrefix,
      5000
    );
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

  test.fixme(
    'Enter key triggers correct behaviour for login form',
    async ({ page }) => {
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
    }
  );

  test.fixme(
    'Registration form displays errors correctly',
    async ({ page }) => {
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
    }
  );

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

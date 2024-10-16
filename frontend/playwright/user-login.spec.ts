import { test, expect } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import { getInbucketEmail } from './utils';

test('User can register', async ({ page }) => {
  await page.goto('/');
  const loginablePage = new LoginablePage(page);
  await loginablePage.openLoginOrRegisterForm('register');

  const randomVal = Math.random().toString(36).substring(2);
  const emailWithoutDomain = `test-${randomVal}-glasummit`;
  const emailValue = `${emailWithoutDomain}@test.email`;
  await loginablePage.fillInRegistrationForm({
    firstname: 'Test_' + randomVal,
    lastname: 'User',
    email: emailValue
  });

  await loginablePage.submitForm().then(() => {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }); // defaults to button click

  const mail = await getInbucketEmail(emailWithoutDomain);

  // await expect(
  //   page.locator('role=dialog', { hasText: /Thank you.*check.*email/i })
  // ).toBeVisible();

  const emailText = mail.body.text;
  const emailHtml = mail.body.html;

  const textMatcher = /Your One-Time-Passcode \(OTP\) token is ([0-9]{6})/i;
  const matchGroups = emailText.match(textMatcher);
  const htmlMatcher = /<p.*>([0-9]{6})<\/p>/i;
  const htmlMatchGroups = emailHtml.match(htmlMatcher);

  const textOtp = matchGroups?.[1];
  const htmlOtp = htmlMatchGroups?.[1];
  expect(textOtp).toBeDefined();
  expect(htmlOtp).toBeDefined();
  expect(textOtp).toBe(htmlOtp);
  console.log({ textOtp });

  // const userId = newUserData['userId']
  // expect(userId).toBeDefined()

  // console.log('Deleting user with id: ', userId)
  // const adminClient = createAdminClient()
  // const { data: uData, error } = await adminClient.auth.admin.deleteUser(userId)
  // console.log({ uData, error })
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

test.fixme('Registration form displays errors correctly', async ({ page }) => {
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

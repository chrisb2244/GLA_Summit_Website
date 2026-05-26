import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export class LoginablePage {
  readonly page: Page;
  readonly loginOrRegisterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginOrRegisterButton = this.page.locator('role=button', {
      hasText: /sign in/i
    });
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  private loginForm() {
    return this.page.getByRole('form', { name: 'Login Form' });
  }

  private registrationForm() {
    return this.page.getByRole('form', { name: 'Registration Form' });
  }

  private verificationForm() {
    return this.page.getByRole('form', { name: 'Verification Code form' });
  }

  private async waitForLoginForm() {
    await this.page.waitForURL(/\/auth\/login/);
    const form = this.loginForm();
    await expect(form.getByLabel('Email')).toBeVisible();
    await expect(form.getByLabel('First Name')).toHaveCount(0);
    await expect(form.getByLabel('Last Name')).toHaveCount(0);
  }

  private async waitForRegistrationForm() {
    await this.page.waitForURL(/\/auth\/register/);
    const form = this.registrationForm();
    await expect(form.getByLabel('First Name')).toBeVisible();
    await expect(form.getByLabel('Last Name')).toBeVisible();
    await expect(form.getByLabel('Email')).toBeVisible();
  }

  async openLoginOrRegisterForm(type?: 'login' | 'register') {
    await expect(this.loginOrRegisterButton).toBeVisible();
    await this.loginOrRegisterButton.click();
    await this.page.waitForURL(/\/auth\/(login|register)/);

    if (type === 'register') {
      if (!(await this.registrationForm().isVisible())) {
        await this.loginForm()
          .getByRole('link', { name: /Join Now/i })
          .click();
      }
      await this.waitForRegistrationForm();
      return;
    }

    if (type === 'login') {
      if (await this.registrationForm().isVisible()) {
        await this.registrationForm()
          .getByRole('link', { name: /Sign In/i })
          .click();
      }
      await this.waitForLoginForm();
    }
  }

  async isLoginForm(): Promise<boolean> {
    return this.page
      .getByText('In order to sign in, enter the email address')
      .isVisible();
  }

  async isRegistrationForm(): Promise<boolean> {
    const form = this.registrationForm();
    return Promise.all([
      form.getByLabel('First Name').isVisible(),
      form.getByLabel('Last Name').isVisible(),
      form.getByLabel('Email').isVisible()
    ]).then(([a, b, c]) => a && b && c);
  }

  async isVerificationForm(): Promise<boolean> {
    return this.page
      .getByRole('textbox', { name: 'Verification Code' })
      .isVisible();
  }

  async fillInLoginForm(email: string) {
    await this.loginForm().getByLabel('Email').fill(email);
  }

  async fillInRegistrationForm(values: {
    firstname?: string;
    lastname?: string;
    email?: string;
  }) {
    const form = this.registrationForm();
    if (values.firstname !== undefined) {
      await form.getByLabel('First Name').fill(values.firstname);
    }
    if (values.lastname !== undefined) {
      await form.getByLabel('Last Name').fill(values.lastname);
    }
    if (values.email !== undefined) {
      await form.getByLabel('Email').fill(values.email);
    }
  }

  async fillInVerificationForm(code: string) {
    await this.page.waitForURL(/\/auth\/validateLogin/);
    await this.page
      .getByRole('textbox', { name: 'Verification Code' })
      .fill(code);
  }

  async submitForm(method?: 'enter key' | 'button click') {
    const activeForm = (await this.isVerificationForm())
      ? this.verificationForm()
      : (await this.isRegistrationForm())
      ? this.registrationForm()
      : (await this.loginForm().isVisible())
      ? this.loginForm()
      : this.page.locator('form').first();

    if (method === 'enter key') {
      await activeForm.press('Enter');
      return true;
    }

    const formType = (await this.isVerificationForm())
      ? 'verification'
      : (await this.isLoginForm())
      ? 'login'
      : (await this.isRegistrationForm())
      ? 'registration'
      : undefined;
    let labelMatcher = undefined;
    switch (formType) {
      case 'login':
        labelMatcher = /log ?in|logging ?in/i;
        break;
      case 'registration':
        labelMatcher = /register|registering/i;
        break;
      case 'verification':
        labelMatcher = /submit|submitting/i;
        break;
    }
    const button = activeForm
      .getByRole('button')
      .filter({ hasText: labelMatcher })
      .first();

    if (!(await button.isVisible({ timeout: 200 }).catch(() => false))) {
      return false;
    }

    if (await button.isDisabled({ timeout: 100 })) {
      return false;
    }
    return await button
      .click({ noWaitAfter: true, timeout: 1000 })
      .then(() => true)
      .catch(() => false);
  }

  async getAllErrors() {
    return this.page.getByRole('alert').allTextContents();
  }
}

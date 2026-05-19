import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export class LoginablePage {
  readonly page: Page;
  readonly loginOrRegisterButton: Locator;
  readonly form: Locator;
  readonly firstnameInput: Locator;
  readonly lastnameInput: Locator;
  readonly emailInput: Locator;
  readonly verificationInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginOrRegisterButton = this.page.locator('role=button', {
      hasText: /sign in/i
    });

    // Email is part of both login and registration
    this.form = this.page.locator('role=form');

    this.firstnameInput = this.form.locator('label:has-text("First Name")');
    this.lastnameInput = this.form.locator('label:has-text("Last Name")');
    this.emailInput = this.form.locator('label:has-text("Email")');

    this.verificationInput = this.form.locator(
      'label:has-text("Verification Code")'
    );
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  private async waitForLoginForm() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.firstnameInput).toBeHidden();
    await expect(this.lastnameInput).toBeHidden();
  }

  private async waitForRegistrationForm() {
    await expect(this.firstnameInput).toBeVisible();
    await expect(this.lastnameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
  }

  async openLoginOrRegisterForm(type?: 'login' | 'register') {
    // The login/register button should be visible
    await expect(this.loginOrRegisterButton).toBeVisible();

    // Click the button, expect a form to be accessible
    await this.loginOrRegisterButton.click();
    await expect(this.form).toBeVisible();

    // If required, change the form type.
    if (type !== undefined) {
      const isRegistrationForm = await this.firstnameInput.isVisible();
      switch (type) {
        case 'register':
          if (isRegistrationForm) {
            await this.waitForRegistrationForm();
            return;
          } else {
            await this.form
              .locator('role=link', { hasText: /Join Now/i })
              .click();
            await this.waitForRegistrationForm();
            return;
          }
        case 'login':
          if (isRegistrationForm) {
            await this.form
              .locator('role=link', { hasText: /Sign In/i })
              .click();
            await this.waitForLoginForm();
            return;
          } else {
            await this.waitForLoginForm();
            return;
          }
      }
    }
  }

  async isLoginForm(): Promise<boolean> {
    if (this.form === null) {
      return false;
    }
    return await this.form.allTextContents().then((textArray) => {
      const containsLoginText = textArray.some((textElement) => {
        return textElement.includes(
          'In order to sign in, enter the email address'
        );
      });
      return containsLoginText;
    });
  }

  async isRegistrationForm(): Promise<boolean> {
    if (this.form === null) {
      return false;
    }
    return Promise.all([
      this.firstnameInput.isVisible(),
      this.lastnameInput.isVisible(),
      this.emailInput.isVisible()
    ]).then(([a, b, c]) => a && b && c);
  }

  async isVerificationForm(): Promise<boolean> {
    if (this.form === null) {
      return false;
    }
    return await this.verificationInput.isVisible();
  }

  async fillInLoginForm(email: string) {
    await this.emailInput.fill(email);
  }

  async fillInRegistrationForm(values: {
    firstname?: string;
    lastname?: string;
    email?: string;
  }) {
    if (values.firstname !== undefined) {
      await this.firstnameInput.fill(values.firstname);
    }
    if (values.lastname !== undefined) {
      await this.lastnameInput.fill(values.lastname);
    }
    if (values.email !== undefined) {
      await this.emailInput.fill(values.email);
    }
  }

  async fillInVerificationForm(code: string) {
    await this.verificationInput.fill(code);
  }

  async submitForm(method?: 'enter key' | 'button click') {
    if (method === 'enter key') {
      await this.form.press('Enter');
      return true;
    } else {
      const formType = (await this.isLoginForm())
        ? 'login'
        : (await this.isRegistrationForm())
        ? 'registration'
        : (await this.isVerificationForm())
        ? 'verification'
        : undefined;
      let labelMatcher = undefined;
      switch (formType) {
        case 'login':
          labelMatcher = /log ?in/i;
          break;
        case 'registration':
          labelMatcher = /register/i;
          break;
        case 'verification':
          labelMatcher = /submit/i;
          break;
      }
      const button = this.form
        .getByRole('button')
        .filter({ hasText: labelMatcher });

      if (await button.isDisabled({ timeout: 100 })) {
        return false;
      }
      await button.click();
      return true;
    }
  }

  async getAllErrors() {
    return await this.form.getByRole('alert').allTextContents();
  }

  async switchForm() {
    const isLogin = await this.isLoginForm();
    await this.form
      .locator('role=button', {
        hasText: (await isLogin) ? /Join Now/i : /Sign In/i
      })
      .click();
    if (isLogin) {
      // was login, now registration
      await this.firstnameInput.waitFor({ state: 'visible' });
    } else {
      // was registration, now login
      await this.form
        .locator('text="In order to sign in,"')
        .waitFor({ state: 'visible' });
    }
  }
}

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export class CopresenterInvitePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(token: string) {
    await this.page.goto(`/copresenter-invite/${token}`);
  }

  // Waits for the invitation page to fully load (heading visible)
  async waitForInvitePage() {
    await expect(
      this.page.getByRole('heading', { name: 'Co-presenter invitation' })
    ).toBeVisible();
  }

  presentationTitle() {
    return this.page.locator('main .rounded-md p.font-medium');
  }

  acceptButton() {
    return this.page.getByRole('button', { name: /accept/i });
  }

  declineButton() {
    return this.page.getByRole('button', { name: /decline/i });
  }

  async accept() {
    await this.acceptButton().click();
    await expect(this.page.getByText(/accepted/i)).toBeVisible({ timeout: 8000 });
  }

  async decline() {
    await this.declineButton().click();
    await expect(this.page.getByText(/declined/i)).toBeVisible({ timeout: 8000 });
  }

  async isAlreadyResponded() {
    return this.page.getByText(/you have already/i).isVisible();
  }

  async isWrongAccount() {
    return this.page.getByRole('heading', { name: 'Wrong account' }).isVisible();
  }

  async isInvalidToken() {
    return this.page
      .getByRole('heading', { name: 'Invalid or expired invitation' })
      .isVisible();
  }

  async hasResponseButtons() {
    return (
      (await this.acceptButton().isVisible()) ||
      (await this.declineButton().isVisible())
    );
  }
}

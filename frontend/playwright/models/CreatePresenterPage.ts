import { expect, type Locator, type Page } from '@playwright/test';
import type { PresentationType } from '@/lib/databaseModels';

export type CreatePresenterFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
};

// A 1x1 PNG, inlined so the upload test needs no fixture file on disk.
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export class CreatePresenterPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly bioInput: Locator;
  readonly profileImageInput: Locator;
  readonly titleInput: Locator;
  readonly abstractInput: Locator;
  readonly learningPointsInput: Locator;
  readonly presentationTypeInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    const opt = { exact: true };
    this.page = page;
    this.firstNameInput = page.getByLabel('First Name', opt);
    this.lastNameInput = page.getByLabel('Last Name', opt);
    this.emailInput = page.getByLabel('Email Address', opt);
    this.bioInput = page.getByLabel('Bio (optional)', opt);
    this.profileImageInput = page.locator('input[name="profileImage"]');
    this.titleInput = page.getByLabel('Title', opt);
    this.abstractInput = page.getByLabel('Abstract', opt);
    this.learningPointsInput = page.getByLabel('Learning Points (optional)', opt);
    this.presentationTypeInput = page.locator('select[name="presentationType"]');
    this.submitButton = page.getByRole('button', {
      name: 'Create Presenter and Submit',
      exact: true
    });
  }

  async goto() {
    await this.page.goto('/admin/create-presenter');
  }

  async waitForFormLoad() {
    await this.firstNameInput.waitFor({ state: 'visible' });
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async fillFormData(data: Partial<CreatePresenterFormValues>) {
    if (typeof data.firstName !== 'undefined')
      await this.firstNameInput.fill(data.firstName);
    if (typeof data.lastName !== 'undefined')
      await this.lastNameInput.fill(data.lastName);
    if (typeof data.email !== 'undefined')
      await this.emailInput.fill(data.email);
    if (typeof data.bio !== 'undefined') await this.bioInput.fill(data.bio);
    if (typeof data.title !== 'undefined')
      await this.titleInput.fill(data.title);
    if (typeof data.abstract !== 'undefined')
      await this.abstractInput.fill(data.abstract);
    if (typeof data.learningPoints !== 'undefined')
      await this.learningPointsInput.fill(data.learningPoints);
    if (typeof data.presentationType !== 'undefined')
      await this.presentationTypeInput.selectOption(data.presentationType);
  }

  async attachProfileImage(name = 'presenter.png', buffer = TINY_PNG) {
    await this.profileImageInput.setInputFiles({
      name,
      mimeType: 'image/png',
      buffer
    });
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async waitForSuccess(presenterName: string) {
    await expect(
      this.page.getByRole('status').filter({ hasText: presenterName })
    ).toBeVisible({ timeout: 20000 });
  }

  async waitForError(fragment: string | RegExp) {
    await expect(
      this.page.getByRole('alert').filter({ hasText: fragment }).first()
    ).toBeVisible({ timeout: 20000 });
  }
}

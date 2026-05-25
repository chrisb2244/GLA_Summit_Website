import { expect, type Locator, type Page } from '@playwright/test';
import type { EmailProps, PersonProps } from '@/Components/Form/Person';
import type { PresentationType } from '@/lib/databaseModels';

export type FormData = {
  submitter: PersonProps;
  otherPresenters: EmailProps[];
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
  timeWindows: { windowStartTime: Date; windowEndTime: Date }[];
  submitIntent: 'saveDraft' | 'submit';
  speakerAgreement: boolean;
};
type PresentationFormData = Omit<
  FormData,
  'submitter' | 'otherPresenters' | 'timeWindows'
>;

export class PresentationSubmissionPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly abstractInput: Locator;
  readonly learningPointsInput: Locator;
  readonly presentationTypeInput: Locator;
  readonly speakerAgreementInput: Locator;
  readonly duplicateWarning: Locator;

  constructor(page: Page) {
    const opt = { exact: true };
    this.page = page;
    this.titleInput = this.page.getByLabel('Title', opt);
    this.abstractInput = this.page.getByLabel('Abstract', opt);
    this.learningPointsInput = this.page.getByLabel('Learning Points', opt);
    this.presentationTypeInput = this.page.locator(
      'select[name="presentationType"]'
    );
    this.speakerAgreementInput = this.page.getByLabel(
      /I agree to the GLA Summit speaker agreement/i
    );
    this.duplicateWarning = this.page.getByRole('alert');
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  async hasVisibleForm() {
    const promises = [
      this.titleInput.isVisible(),
      this.abstractInput.isVisible(),
      this.learningPointsInput.isVisible()
      // this.presentationTypeInput.isVisible(),
    ];
    const visibleArray = await Promise.all(promises);
    // console.log(visibleArray)
    const allVisible = visibleArray.every((b) => b);
    return allVisible;
  }

  async waitForFormLoad() {
    await this.titleInput.waitFor({ state: 'visible' });
    await this.page
      .getByRole('button', { name: /Submit Presentation|Save Draft/, exact: true })
      .first()
      .waitFor({ state: 'visible' });
  }

  async waitForDraftSaved(title: string) {
    await expect(
      this.page.getByText('You have no active draft submissions')
    ).toBeHidden({ timeout: 20000 });

    await expect(
      this.page.getByRole('link', { name: title, exact: true })
    ).toBeVisible({ timeout: 20000 });
  }

  async waitForSubmittedSuccess(title: string) {
    const submittedCard = this.page.locator(`div[aria-label="${title}"]`);
    const successMessage = this.page.getByText(
      'Presentation submitted successfully',
      { exact: false }
    );

    await expect(submittedCard.or(successMessage).first()).toBeVisible({
      timeout: 20000
    });
  }

  submitterEmailInput() {
    return this.page.locator('input[name="submitter.email"]');
  }

  async fillFormData(data: Partial<PresentationFormData>) {
    if (typeof data.title !== 'undefined')
      await this.titleInput.fill(data.title);
    if (typeof data.abstract !== 'undefined')
      await this.abstractInput.fill(data.abstract);
    if (typeof data.learningPoints !== 'undefined')
      await this.learningPointsInput.fill(data.learningPoints);

    if (typeof data.presentationType !== 'undefined') {
      await this.presentationTypeInput.selectOption(data.presentationType);
    }

    if (typeof data.speakerAgreement !== 'undefined') {
      await this.setSpeakerAgreement(data.speakerAgreement);
    }
  }

  async setSpeakerAgreement(agreed: boolean) {
    await (agreed
      ? this.speakerAgreementInput.check()
      : this.speakerAgreementInput.uncheck());
  }

  async submitForm(
    preferredLabel?: 'Submit Presentation' | 'Save Draft' | 'Submit Anyway'
  ) {
    const labelOrder = preferredLabel
      ? [preferredLabel, 'Submit Anyway', 'Submit Presentation', 'Save Draft']
      : ['Submit Anyway', 'Submit Presentation', 'Save Draft'];

    for (const label of labelOrder) {
      const button = this.page.getByRole('button', {
        name: label,
        exact: true
      });
      if (await button.isVisible()) {
        await button.click();
        return;
      }
    }

    throw new Error('No visible submit button found for presentation form');
  }
}

import type { Locator, Page } from '@playwright/test';
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
  isFinal: boolean;
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
  readonly isFinalInput: Locator;
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
    this.isFinalInput = this.page.getByLabel(
      /I am ready to submit this presentation/i
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
    // await this.presentationTypeInput.waitFor({state: 'visible'})
  }

  async fillFormData(data: Partial<PresentationFormData>) {
    if (typeof data.title !== 'undefined')
      await this.titleInput.fill(data.title);
    if (typeof data.abstract !== 'undefined')
      await this.abstractInput.fill(data.abstract);
    if (typeof data.learningPoints !== 'undefined')
      await this.learningPointsInput.fill(data.learningPoints);

    if (typeof data.presentationType !== 'undefined') {
      const optionString = await this.presentationTypeInput
        .getByText(data.presentationType)
        .innerText();

      await this.presentationTypeInput.selectOption(optionString);
    }

    if (typeof data.isFinal !== 'undefined') {
      await this.setReadyToSubmit(data.isFinal);
    }
    if (typeof data.speakerAgreement !== 'undefined') {
      await this.setSpeakerAgreement(data.speakerAgreement);
    }
  }

  async setReadyToSubmit(isReady: boolean) {
    await (isReady ? this.isFinalInput.check() : this.isFinalInput.uncheck());
  }

  async setSpeakerAgreement(agreed: boolean) {
    await (agreed
      ? this.speakerAgreementInput.check()
      : this.speakerAgreementInput.uncheck());
  }

  async submitForm(preferredLabel?: 'Submit Presentation' | 'Save Draft' | 'Submit Anyway') {
    const labelOrder = preferredLabel
      ? [preferredLabel, 'Submit Anyway', 'Submit Presentation', 'Save Draft']
      : ['Submit Anyway', 'Submit Presentation', 'Save Draft'];

    for (const label of labelOrder) {
      const button = this.page.getByRole('button', { name: label, exact: true });
      if (await button.isVisible()) {
        await button.click();
        return;
      }
    }

    throw new Error('No visible submit button found for presentation form');
  }
}

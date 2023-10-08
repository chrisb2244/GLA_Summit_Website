import type { FormData as SubmissionData } from '../../src/Components/Forms/PresentationSubmissionForm';
import type { Locator, Page } from '@playwright/test';

type PresentationFormData = Omit<
  SubmissionData,
  'submitter' | 'otherPresenters' | 'timeWindows'
>;

export class PresentationSubmissionPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly abstractInput: Locator;
  readonly learningPointsInput: Locator;
  readonly presentationTypeInput: Locator;
  readonly isFinalInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = this.page.locator('label:has-text("Title")');
    this.abstractInput = this.page.locator('label:has-text("Abstract")');
    this.learningPointsInput = this.page.locator(
      'label:has-text("Learning Points")'
    );
    this.presentationTypeInput = this.page.locator(
      'label:has-text("Presentation Type") >> xpath=.. >> role=button'
    );
    this.isFinalInput = this.page.locator('role=checkbox');
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
      // Mui selects aren't actually <select> items
      // they produce a popup listbox and a button...
      await this.presentationTypeInput.click();
      const regexp = new RegExp(data.presentationType);
      await this.page.getByText(regexp).click();
    }

    if (typeof data.isFinal !== 'undefined') {
      await (data.isFinal
        ? this.isFinalInput.check()
        : this.isFinalInput.uncheck());
    }
  }
}

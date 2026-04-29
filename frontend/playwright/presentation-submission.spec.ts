import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import { CAN_SUBMIT_PRESENTATION } from '@/app/configConstants';
import path from 'path';
import { createSupabaseAdmin, getInbucketEmail, loginOnPage } from './utils';

[true, false].forEach((jsEnabled) => {
  const trailing = `with JS ${jsEnabled ? 'enabled' : 'disabled'}`;

  test.describe(`logged-out tests for presentation submission ${trailing}`, () => {
    test.use({ javaScriptEnabled: jsEnabled });
    test('Form submission unavailable if logged out', async ({ page }) => {
      await page.goto('/submit-presentation');
      await expect(page.getByText('You need to be logged in')).toBeVisible();
    });

    test('Form loads correctly after logging in', async ({ page }) => {
      test.fixme(!jsEnabled, 'JS disabled');

      await page.goto('/submit-presentation');
      await expect(page.getByText('You need to be logged in')).toBeVisible();

      const email = process.env.TEST_ATTENDEE_EMAIL as string;
      await loginOnPage(page, email);

      if (CAN_SUBMIT_PRESENTATION) {
        await expect(
          page.getByRole('heading', { name: /Submit a .*Presentation/ })
        ).toBeVisible();
      } else {
        await expect(
          page.getByText('The presentation submission process is closed.')
        ).toBeVisible();
      }
    });
  });

  test.describe(`logged-in tests for presentation submission ${trailing}`, () => {
    test.skip(!CAN_SUBMIT_PRESENTATION, 'Presentation submission closed');
    test.use({
      javaScriptEnabled: jsEnabled,
      storageState: async ({}, use) =>
        use(path.resolve(__dirname, '.auth', 'attendee.json'))
    });

    // Use an existing user who is not a presenter or organizer
    const attendeeEmail = process.env.TEST_ATTENDEE_EMAIL as string;
    const buildTestTitle = (prefix: string) =>
      `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

    test(
      '/submit-presentation is accessible',
      { tag: '@smoke' },
      async ({ page }) => {
        // This page should be accessible to all logged-in users
        await page.goto('/submit-presentation');

        await expect(
          page.getByRole('heading', { name: /Submit a .*Presentation/ })
        ).toBeVisible();
      }
    );

    test('Submitter is prefilled and locked', async ({ page }) => {
      await page.goto('/submit-presentation');

      const formPage = new PresentationSubmissionPage(page);

      // Wait for the login dialog to disappear (have saved session state)
      await formPage.waitForFormLoad();

      expect(await formPage.hasVisibleForm()).toBeTruthy();

      // Using the test attendee user, we expect
      const submitterEmailInput = page.locator('label:has-text("Email")');
      expect(await submitterEmailInput.isVisible()).toBeTruthy();
      expect(await submitterEmailInput.isEditable()).toBeFalsy();
      expect(await submitterEmailInput.inputValue()).toEqual(attendeeEmail);
    });

    test('Form fill testing', async ({ page }) => {
      // Skip if the presentation submission is closed
      // The message is checked in a different test
      await page.goto('/my-presentations');

      const formPage = new PresentationSubmissionPage(page);

      // Wait for the login dialog to disappear (have saved session state)
      await formPage.waitForFormLoad();

      expect(await formPage.hasVisibleForm()).toBeTruthy();

      const testTitle = 'Test presentation title' + Math.random();
      // Repeat to exceed required lengths
      const abstract = 'Blah blah '.repeat(20);
      const learningPoints = 'Other text '.repeat(10);
      const isFinal = true;

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal
      });

      await expect(formPage.titleInput).toHaveValue(testTitle);
      // expect(await formPage.isFinalInput.isChecked()).toEqual(true);

      await formPage.submitForm();

      // Should blank out on successful submission
      // Can't use the toBeEmpty here
      await expect(formPage.titleInput).toHaveValue('');

      const submittedPresentationsDiv = page.locator(
        'div:has-text("Submitted Presentations")'
      );
      const newSubmittedPresentation =
        submittedPresentationsDiv.getByLabel(testTitle);
      await expect(newSubmittedPresentation).toBeVisible();

      // Check it is marked as under consideration
      const statusDiv = newSubmittedPresentation.getByText(
        'Under Consideration'
      );
      await expect(statusDiv).toBeVisible();

      // Check an email is received for the submission
      const mailboxId = attendeeEmail.split('@')[0];
      const emailMsg = await getInbucketEmail(mailboxId, 5000, 3000);
      const {
        subject,
        body: { html }
      } = emailMsg;
      expect(subject).toContain('Thank you for submitting a presentation');
      expect(html).toContain(testTitle);
      expect(html).toContain(abstract);
      expect(html).toContain(learningPoints);

      // Check the database entry is created
      const adminSB = createSupabaseAdmin();
      const { data: presentations } = await adminSB
        .from('presentation_submissions')
        .select('*')
        .eq('title', testTitle)
        .single();
      expect(presentations?.is_submitted).toEqual(isFinal);
    });

    test('draft save shows draft card in Draft Submissions', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/my-presentations');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Draft visibility');
      const abstract = 'Draft abstract '.repeat(12);
      const learningPoints = 'Draft learning point '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal: false
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');

      await expect(
        page.getByRole('heading', { name: 'Draft Submissions', exact: true })
      ).toBeVisible();
      await expect(page.getByRole('link', { name: testTitle, exact: true })).toBeVisible();
    });

    test('saved draft remains visible after reload', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/my-presentations');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Draft reload visibility');
      const abstract = 'Reload abstract '.repeat(12);
      const learningPoints = 'Reload learning point '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: 'full length',
        isFinal: false
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');

      await page.reload();
      await expect(page.getByRole('link', { name: testTitle, exact: true })).toBeVisible();
    });

    test('saved draft stores is_submitted false in database', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/my-presentations');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Draft database value');
      const abstract = 'Database abstract '.repeat(12);
      const learningPoints = 'Database learning point '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '7x7',
        isFinal: false
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');

      const adminSB = createSupabaseAdmin();
      const { data: presentations } = await adminSB
        .from('presentation_submissions')
        .select('is_submitted')
        .eq('title', testTitle)
        .single();

      expect(presentations?.is_submitted).toEqual(false);
    });

    test('draft card navigates to edit route', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/my-presentations');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Draft edit navigation');
      const abstract = 'Edit route abstract '.repeat(12);
      const learningPoints = 'Edit route learning point '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal: false
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');

      await page.getByRole('link', { name: testTitle, exact: true }).click();
      await expect(page).toHaveURL(/\/my-presentations\/[^/]+\/edit$/);
    });

    test('failed submit (required field) preserves entered values', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/submit-presentation');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const abstract = 'Required validation abstract '.repeat(10);
      const learningPoints = 'Required validation learning point '.repeat(4);

      await formPage.fillFormData({
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal: true
      });
      await formPage.setSpeakerAgreement(true);

      await formPage.submitForm('Submit Presentation');

      await expect(formPage.titleInput).toHaveAttribute('aria-invalid', 'true');
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
    });

    test('duplicate warning preserves values and enables Submit Anyway', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/my-presentations');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Duplicate warning');
      const abstract = 'Duplicate abstract '.repeat(12);
      const learningPoints = 'Duplicate learning point '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: 'full length',
        isFinal: false
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');

      await page.getByRole('button', { name: 'Submit another presentation' }).click();
      await formPage.waitForFormLoad();

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: 'full length',
        isFinal: true
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Submit Presentation');

      await expect(formPage.duplicateWarning).toBeVisible();
      await expect(formPage.titleInput).toHaveValue(testTitle);
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
      await expect(
        page.getByRole('button', { name: 'Submit Anyway', exact: true })
      ).toBeVisible();
    });

    test('missing speaker agreement preserves non-failing fields', async ({ page }) => {
      test.fixme(!jsEnabled, 'Requires JS-enabled client-side form state');

      await page.goto('/submit-presentation');
      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const title = buildTestTitle('Missing agreement');
      const abstract = 'Agreement abstract '.repeat(12);
      const learningPoints = 'Agreement learning point '.repeat(4);

      await formPage.fillFormData({
        title,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal: true
      });
      await formPage.setSpeakerAgreement(false);

      await formPage.submitForm('Submit Presentation');

      await expect(page.getByText('You must agree to the speaker agreement to submit.')).toBeVisible();
      await expect(formPage.titleInput).toHaveValue(title);
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
    });

    test('Missing title cannot submit', async ({ page }) => {
      await page.goto('/submit-presentation');

      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      // Need to exceed 100 chars
      const abstract = 'Blah blah '.repeat(20);
      // Need to exceed 50 chars
      const learningPoints = 'Blah'.repeat(15);

      await formPage.fillFormData({
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        isFinal: true
      });

      await formPage.submitForm();

      await expect(formPage.titleInput).toHaveAttribute('aria-invalid', 'true');

      // Check that the other elements are still filled
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
    });

    // test('Switching tabs does not change form content', async ({ page, context }) => {
    //   const formPage = new PresentationSubmissionPage(page)
    //   await formPage.goto('/submit-presentation')
    //   // Wait for the login dialog to disappear (have saved session state)
    //   await formPage.waitForFormLoad()

    //   // Expect a clean form
    //   expect(await formPage.titleInput.inputValue()).toEqual("")

    //   const testTitle = 'Form title for checking values dont change';
    //   const abstract = new Array(10).fill(testTitle).join(" ")
    //   await formPage.fillFormData({
    //     title: testTitle,
    //     abstract
    //   })

    //   expect(await formPage.titleInput.inputValue()).toEqual(testTitle)

    //   const otherPage = await context.newPage();
    //   await otherPage.goto("https://google.com");
    //   await otherPage.bringToFront();

    //   await page.bringToFront();
    //   expect(await formPage.titleInput.inputValue()).toEqual(testTitle)
    //   expect(await formPage.abstractInput.textContent()).not.toEqual("")
    // })
  });
});

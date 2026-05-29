import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import {
  CAN_SUBMIT_PRESENTATION,
  submissionsForYear
} from '@/app/configConstants';
import path from 'path';
import {
  createSupabaseAdmin,
  deletePresentationByTitle,
  getEmailsWithSubject,
  loginOnPage
} from './utils';
import { MessageModel } from 'inbucket-js-client';

// Use an existing user who is not a presenter or organizer
const attendeeEmail = process.env.TEST_ATTENDEE_EMAIL as string;
const organizerEmail = process.env.TEST_ORGANIZER_EMAIL as string;
const buildTestTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

[true].forEach((jsEnabled) => {
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
      await loginOnPage(page, email, {
        expectedPath: /\/my-presentations(?:\?.*)?$/,
        redirectTimeoutMs: 5000
      });

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

    test(
      '/submit-presentation is accessible',
      { tag: '@regression' },
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

      await formPage.waitForFormLoad();

      expect(await formPage.hasVisibleForm()).toBeTruthy();

      const submitterEmailInput = formPage.submitterEmailInput();
      await expect(submitterEmailInput).toBeVisible();
      await expect(submitterEmailInput).toHaveAttribute('readonly', '');
      await expect(submitterEmailInput).toHaveValue(attendeeEmail);
    });

    test('Form fill testing', async ({ page }) => {
      // Skip if the presentation submission is closed
      // The message is checked in a different test
      await page.goto('/my-presentations');

      const formPage = new PresentationSubmissionPage(page);

      await formPage.waitForFormLoad();

      expect(await formPage.hasVisibleForm()).toBeTruthy();

      const testTitle = 'Test presentation title' + Math.random();
      // Repeat to exceed required lengths
      const abstract = 'Blah blah '.repeat(20);
      const learningPoints = 'Other text '.repeat(10);
      const speakerAgreement = true;

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        submitIntent: 'submit',
        speakerAgreement
      });

      await expect(formPage.titleInput).toHaveValue(testTitle);
      // expect(await formPage.isFinalInput.isChecked()).toEqual(true);

      await formPage.submitForm();

      await formPage.waitForSubmittedSuccess(testTitle);

      const submittedPresentationsDiv = page.locator(
        'div:has-text("Submitted Presentations")'
      );
      const newSubmittedPresentation =
        submittedPresentationsDiv.getByLabel(testTitle);
      await expect(newSubmittedPresentation).toBeVisible();

      await expect(
        newSubmittedPresentation.getByText('Under consideration', {
          exact: true
        })
      ).toBeVisible();

      // Check an email is received for the submission
      const mailboxId = attendeeEmail.split('@')[0];

      const matchesExpectation = (email: MessageModel) => {
        const html = email.body.html;
        return (
          html.includes(testTitle) &&
          html.includes(abstract) &&
          html.includes(learningPoints)
        );
      };

      await expect(async () => {
        const matchingEmails = await getEmailsWithSubject(
          mailboxId,
          'GLA Summit: Thank you for submitting a presentation'
        ).then((emails) => emails.filter(matchesExpectation));

        expect(matchingEmails.length).toEqual(1);
      }).toPass({ timeout: 10000 });

      // Check the database entry is created
      const adminSB = createSupabaseAdmin();
      const { data: presentations } = await adminSB
        .from('presentation_submissions')
        .select('*')
        .eq('title', testTitle)
        .single();
      expect(presentations?.is_submitted).toEqual(true);

      await deletePresentationByTitle(testTitle, attendeeEmail);
    });

    test('organizer receives notification email on final submission', async ({
      page
    }) => {
      await page.goto('/my-presentations');

      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Organizer notification');
      const abstract = 'Organizer notify abstract '.repeat(10);
      const learningPoints = 'Organizer notify learning '.repeat(4);

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        submitIntent: 'submit',
        speakerAgreement: true
      });

      await formPage.submitForm();
      await formPage.waitForSubmittedSuccess(testTitle);

      const organizerMailbox = organizerEmail.split('@')[0];

      const matchesExpectation = (email: MessageModel) => {
        const html = email.body.html;
        return html.includes(testTitle) && html.includes('review-submission');
      };

      await expect(async () => {
        const matchingEmails = await getEmailsWithSubject(
          organizerMailbox,
          'GLA Summit: New presentation submitted'
        ).then((emails) => emails.filter(matchesExpectation));

        expect(matchingEmails.length).toEqual(1);
      }).toPass({ timeout: 10000 });

      await deletePresentationByTitle(testTitle, attendeeEmail);
    });

    test('draft save shows draft card in Draft Submissions', async ({
      page
    }) => {
      test.fixme(
        !jsEnabled,
        'Current no-JS my-presentations route remains on loading fallback'
      );

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
        submitIntent: 'saveDraft'
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');
      await formPage.waitForDraftSaved(testTitle);

      await expect(
        page.getByRole('heading', { name: 'Draft Submissions', exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: testTitle, exact: true })
      ).toBeVisible();
    });

    test('saved draft remains visible after reload', async ({ page }) => {
      test.fixme(
        !jsEnabled,
        'Current no-JS my-presentations route remains on loading fallback'
      );

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
        submitIntent: 'saveDraft'
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');
      await formPage.waitForDraftSaved(testTitle);

      await page.reload();
      await expect(
        page.getByRole('link', { name: testTitle, exact: true })
      ).toBeVisible();
    });

    test('saved draft stores is_submitted false in database', async ({
      page
    }) => {
      test.fixme(
        !jsEnabled,
        'Current no-JS my-presentations route remains on loading fallback'
      );

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
        submitIntent: 'saveDraft'
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');
      await formPage.waitForDraftSaved(testTitle);

      const adminSB = createSupabaseAdmin();
      const { data: presentation } = await adminSB
        .from('presentation_submissions')
        .select('is_submitted')
        .eq('title', testTitle)
        .maybeSingle();

      expect(presentation).not.toBeNull();
      expect(presentation?.is_submitted).toEqual(false);
    });

    test('draft card navigates to edit route', async ({ page }) => {
      test.fixme(
        !jsEnabled,
        'Current no-JS my-presentations route remains on loading fallback'
      );

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
        submitIntent: 'saveDraft'
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');
      await formPage.waitForDraftSaved(testTitle);

      const draftCard = page
        .getByRole('link', { name: testTitle, exact: true })
        .locator('..');
      await draftCard.getByRole('link', { name: 'Edit', exact: true }).click();
      await expect(page).toHaveURL(/\/my-presentations\/edit\/[^/]+$/);
    });

    test('failed submit (required field) preserves entered values', async ({
      page
    }) => {
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
        submitIntent: 'submit'
      });
      await formPage.setSpeakerAgreement(true);

      await formPage.submitForm('Submit Presentation');

      const titleValidity = await formPage.titleInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );
      expect(titleValidity.length).toBeGreaterThan(0);
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
    });

    test('duplicate warning preserves values and enables Submit Anyway', async ({
      page
    }) => {
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
        submitIntent: 'saveDraft'
      });
      await formPage.setSpeakerAgreement(true);
      await formPage.submitForm('Save Draft');
      await formPage.waitForDraftSaved(testTitle);

      await formPage.waitForFormLoad();

      await formPage.fillFormData({
        title: testTitle,
        abstract,
        learningPoints,
        presentationType: 'full length',
        submitIntent: 'submit'
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

    test('missing speaker agreement preserves non-failing fields', async ({
      page
    }) => {
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
        submitIntent: 'submit'
      });
      await formPage.setSpeakerAgreement(false);

      await formPage.submitForm('Submit Presentation');

      await expect(
        page.getByText('You must agree to the speaker agreement to submit', {
          exact: false
        })
      ).toBeVisible();
      await expect(formPage.titleInput).toHaveValue(title);
      await expect(formPage.abstractInput).toHaveValue(abstract);
      await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
    });

    test('Missing title cannot submit', async ({ page }) => {
      await page.goto('/submit-presentation');

      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      const abstract = 'Blah blah '.repeat(20);
      const learningPoints = 'Blah'.repeat(15);

      await formPage.fillFormData({
        abstract,
        learningPoints,
        presentationType: '15 minutes',
        submitIntent: 'submit'
      });

      await formPage.submitForm();

      const titleValidity = await formPage.titleInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );
      expect(titleValidity.length).toBeGreaterThan(0);
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

test.describe(`presentation submission tests handling no-js only path`, () => {
  test.use({ javaScriptEnabled: false });
  test.skip(!CAN_SUBMIT_PRESENTATION, 'Presentation submission closed');
  test.fixme(
    true,
    'No-JS flows currently remain on loading fallback (form controls never render). Keep coverage here for re-enable once server-rendered path is fixed.'
  );
  test.use({
    storageState: async ({}, use) =>
      use(path.resolve(__dirname, '.auth', 'attendee.json'))
  });

  test('no-js: Save Draft persists using server action fallback', async ({
    page
  }) => {
    const adminSB = createSupabaseAdmin();
    const title = buildTestTitle('No JS draft save fallback');

    const { data: emailLookup } = await adminSB
      .from('email_lookup')
      .select('id')
      .eq('email', attendeeEmail)
      .single();

    expect(emailLookup?.id).toBeTruthy();

    const { data: draftInsert } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS draft abstract '.repeat(12),
        learning_points: 'No JS draft learning point '.repeat(4),
        submitter_id: emailLookup!.id,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: 'full length'
      })
      .select('id')
      .single();

    expect(draftInsert?.id).toBeTruthy();

    await adminSB.from('presentation_presenters').upsert({
      presentation_id: draftInsert!.id,
      presenter_id: emailLookup!.id
    });

    const editUrl = `/my-presentations/edit/${draftInsert!.id}`;
    await page.goto(editUrl);
    await expect(
      page.getByRole('heading', { name: 'Edit Draft Presentation' })
    ).toBeVisible();

    const formPage = new PresentationSubmissionPage(page);
    await formPage.waitForFormLoad();
    await formPage.learningPointsInput.fill(
      'No JS saved learning points '.repeat(4)
    );
    await formPage.submitForm('Save Draft');

    const { data: updatedDraft } = await adminSB
      .from('presentation_submissions')
      .select('id, is_submitted, learning_points')
      .eq('id', draftInsert!.id)
      .maybeSingle();

    expect(updatedDraft).not.toBeNull();
    expect(updatedDraft?.is_submitted).toEqual(false);
    expect(updatedDraft?.learning_points).toContain(
      'No JS saved learning points'
    );

    await adminSB
      .from('presentation_submissions')
      .delete()
      .eq('id', draftInsert!.id);
  });

  test('no-js: Submit from edit page finalizes draft', async ({ page }) => {
    const adminSB = createSupabaseAdmin();
    const title = buildTestTitle('No JS edit submit fallback');

    const { data: emailLookup } = await adminSB
      .from('email_lookup')
      .select('id')
      .eq('email', attendeeEmail)
      .single();

    expect(emailLookup?.id).toBeTruthy();

    const { data: draftInsert } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS edit abstract '.repeat(12),
        learning_points: 'No JS edit learning point '.repeat(4),
        submitter_id: emailLookup!.id,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: 'full length'
      })
      .select('id')
      .single();

    expect(draftInsert?.id).toBeTruthy();

    await adminSB.from('presentation_presenters').upsert({
      presentation_id: draftInsert!.id,
      presenter_id: emailLookup!.id
    });

    const editUrl = `/my-presentations/edit/${draftInsert!.id}`;
    await page.goto(editUrl);
    await expect(
      page.getByRole('heading', { name: 'Edit Draft Presentation' })
    ).toBeVisible();

    const formPage = new PresentationSubmissionPage(page);
    await formPage.setSpeakerAgreement(true);
    await page
      .getByRole('button', { name: 'Submit Presentation', exact: true })
      .click();

    const { data: submittedRow } = await adminSB
      .from('presentation_submissions')
      .select('id, is_submitted')
      .eq('id', draftInsert!.id)
      .maybeSingle();

    expect(submittedRow).not.toBeNull();
    expect(submittedRow?.is_submitted).toEqual(true);

    const response = await page.goto(editUrl);
    expect(response?.status()).toEqual(404);

    await adminSB
      .from('presentation_submissions')
      .delete()
      .eq('id', draftInsert!.id);
  });

  test('no-js: duplicate submit from edit page requires Submit Anyway', async ({
    page
  }) => {
    const adminSB = createSupabaseAdmin();
    const title = buildTestTitle('No JS duplicate override');

    const { data: emailLookup } = await adminSB
      .from('email_lookup')
      .select('id')
      .eq('email', attendeeEmail)
      .single();

    expect(emailLookup?.id).toBeTruthy();

    const { data: existingDraft } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS duplicate existing abstract '.repeat(12),
        learning_points: 'No JS duplicate existing learning point '.repeat(4),
        submitter_id: emailLookup!.id,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: 'full length'
      })
      .select('id')
      .single();

    const { data: editableDraft } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS duplicate target abstract '.repeat(12),
        learning_points: 'No JS duplicate target learning point '.repeat(4),
        submitter_id: emailLookup!.id,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: '15 minutes'
      })
      .select('id')
      .single();

    await adminSB.from('presentation_presenters').upsert([
      {
        presentation_id: existingDraft!.id,
        presenter_id: emailLookup!.id
      },
      {
        presentation_id: editableDraft!.id,
        presenter_id: emailLookup!.id
      }
    ]);

    const editUrl = `/my-presentations/edit/${editableDraft!.id}`;
    await page.goto(editUrl);

    const formPage = new PresentationSubmissionPage(page);
    await formPage.setSpeakerAgreement(true);
    await page
      .getByRole('button', { name: 'Submit Presentation', exact: true })
      .click();

    await expect(page.getByText('Possible duplicate')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Submit Anyway', exact: true })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Submit Anyway', exact: true })
      .click();

    const { data: submittedRow } = await adminSB
      .from('presentation_submissions')
      .select('id, is_submitted')
      .eq('id', editableDraft!.id)
      .maybeSingle();

    expect(submittedRow).not.toBeNull();
    expect(submittedRow?.is_submitted).toEqual(true);

    await adminSB
      .from('presentation_submissions')
      .delete()
      .in('id', [existingDraft!.id, editableDraft!.id]);
  });
});

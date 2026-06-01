import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import {
  CAN_SUBMIT_PRESENTATION,
  submissionsForYear
} from '@/app/configConstants';
import {
  createAttendee,
  createOrganizer,
  createSupabaseAdmin,
  getEmailsWithSubject,
  loginOnPage
} from './utils';
import type { SeededUser, TestEmailMessage } from './utils';

const buildTestTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

[true].forEach((jsEnabled) => {
  const trailing = `with JS ${jsEnabled ? 'enabled' : 'disabled'}`;

  test.describe(`logged-out tests for presentation submission ${trailing}`, () => {
    test.use({ javaScriptEnabled: jsEnabled });

    let loggedInUser: SeededUser | undefined;
    test.afterEach(async () => {
      await loggedInUser?.cleanup();
      loggedInUser = undefined;
    });

    test('Form submission unavailable if logged out', { tag: ['@smoke', '@synthetic'] }, async ({
      page
    }) => {
      await page.goto('/submit-presentation');
      await expect(page.getByText('You need to be logged in')).toBeVisible();
    });

    test('Form loads correctly after logging in', async ({ page }) => {
      test.fixme(!jsEnabled, 'JS disabled');

      await page.goto('/submit-presentation');
      await expect(page.getByText('You need to be logged in')).toBeVisible();

      loggedInUser = await createAttendee();
      await page.goto('/');
      await loginOnPage(page, loggedInUser.email);
      await page.goto('/submit-presentation');

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
    test.use({ javaScriptEnabled: jsEnabled });

    // The submitter starts as a plain attendee — submitting is what (potentially)
    // makes them a presenter, so we must not seed that end state.
    let user: SeededUser;
    test.beforeEach(async ({ page }) => {
      user = await createAttendee();
      await page.goto('/');
      await loginOnPage(page, user.email);
    });
    test.afterEach(async () => {
      // Cascades any submissions/drafts this test created, so per-title deletes
      // are unnecessary.
      await user?.cleanup();
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
      await expect(submitterEmailInput).toHaveValue(user.email);
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

      // Fixed lower bound captured before submit (the action that sends the
      // email), so the toPass loop below cannot slide past an already-delivered
      // email. The 5s grace absorbs Mailpit truncating its stored Date to whole
      // seconds (and any host/container clock skew); the unique-title match below
      // means a wider window can never produce a false positive.
      const emailSentAfter = Date.now() - 5000;
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
      const matchesExpectation = (email: TestEmailMessage) => {
        const html = email.body.html;
        return (
          html.includes(testTitle) &&
          html.includes(abstract) &&
          html.includes(learningPoints)
        );
      };

      await expect(async () => {
        const matchingEmails = await getEmailsWithSubject(
          user.email,
          'GLA Summit: Thank you for submitting a presentation',
          emailSentAfter
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
    });

    test('organizer receives notification email on final submission', async ({
      page
    }) => {
      // The notification is sent to every row in the organizers table, so a
      // freshly created organizer receives it in its own (unique) mailbox.
      const organizer = await createOrganizer();
      try {
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

        // Fixed lower bound captured before submit; 5s grace covers Mailpit's
        // whole-second Date truncation and clock skew. See the note in "Form
        // fill testing" — the unique-title match keeps the wide window
        // false-positive-free.
        const emailSentAfter = Date.now() - 5000;
        await formPage.submitForm();
        await formPage.waitForSubmittedSuccess(testTitle);

        const matchesExpectation = (email: TestEmailMessage) => {
          const html = email.body.html;
          return html.includes(testTitle) && html.includes('review-submission');
        };

        await expect(async () => {
          const matchingEmails = await getEmailsWithSubject(
            organizer.email,
            'GLA Summit: New presentation submitted',
            emailSentAfter
          ).then((emails) => emails.filter(matchesExpectation));

          expect(matchingEmails.length).toEqual(1);
        }).toPass({ timeout: 10000 });
      } finally {
        await organizer.cleanup();
      }
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

    test('Switching tabs does not change form content', async ({
      page,
      context
    }) => {
      // Auth comes from the describe-level beforeEach (createAttendee +
      // loginOnPage); the removed saved-storageState path is no longer used.
      await page.goto('/submit-presentation');

      const formPage = new PresentationSubmissionPage(page);
      await formPage.waitForFormLoad();

      // Form starts clean.
      await expect(formPage.titleInput).toHaveValue('');

      const testTitle = buildTestTitle('Tab switch persistence');
      const abstract = 'Tab switch abstract '.repeat(10);
      await formPage.fillFormData({ title: testTitle, abstract });
      await expect(formPage.titleInput).toHaveValue(testTitle);

      // Background this tab by opening and focusing another, mirroring a real
      // user switching away.
      const otherPage = await context.newPage();
      await otherPage.goto('about:blank');
      await otherPage.bringToFront();

      // Sanity check: did backgrounding actually flip this page's visibility?
      // Firefox/headless visibility emulation is unreliable, so if the native
      // event did not fire we drive the hidden→visible cycle ourselves. Either
      // way any focus/visibility-driven reset code path is genuinely exercised
      // before we assert persistence, which prevents a false pass.
      const nativeHidden = await page.evaluate(
        () => document.visibilityState === 'hidden'
      );
      if (!nativeHidden) {
        await page.evaluate(() => {
          const setVisibility = (state: 'hidden' | 'visible') =>
            Object.defineProperty(document, 'visibilityState', {
              configurable: true,
              get: () => state
            });
          setVisibility('hidden');
          document.dispatchEvent(new Event('visibilitychange'));
          window.dispatchEvent(new Event('blur'));
          setVisibility('visible');
          document.dispatchEvent(new Event('visibilitychange'));
          window.dispatchEvent(new Event('focus'));
        });
      }

      // Return to the form tab.
      await page.bringToFront();
      await otherPage.close();

      // Poll (toHaveValue auto-retries) so an async focus-triggered
      // refetch/reset cannot slip past a single synchronous read. Use
      // inputValue semantics — abstract is an uncontrolled <textarea>, so its
      // typed value lives in `.value`, not `.textContent`.
      await expect(formPage.titleInput).toHaveValue(testTitle);
      await expect(formPage.abstractInput).toHaveValue(abstract);
    });
  });
});

// NOTE: these flows are fixme'd (the no-JS server-rendered path is not yet
// functional). When re-enabling, they also need a JS-less authentication
// strategy: loginOnPage drives the client-side login form, which cannot run
// with javaScriptEnabled:false. The previous saved-storageState approach has
// been removed, so a session-cookie injection helper will be required here.
test.describe(`presentation submission tests handling no-js only path`, () => {
  test.use({ javaScriptEnabled: false });
  test.skip(!CAN_SUBMIT_PRESENTATION, 'Presentation submission closed');
  test.fixme(
    true,
    'No-JS flows currently remain on loading fallback (form controls never render). Keep coverage here for re-enable once server-rendered path is fixed.'
  );

  let user: SeededUser;
  test.beforeEach(async () => {
    user = await createAttendee();
  });
  test.afterEach(async () => {
    await user?.cleanup();
  });

  test('no-js: Save Draft persists using server action fallback', async ({
    page
  }) => {
    const adminSB = createSupabaseAdmin();
    const title = buildTestTitle('No JS draft save fallback');

    const { data: draftInsert } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS draft abstract '.repeat(12),
        learning_points: 'No JS draft learning point '.repeat(4),
        submitter_id: user.userId,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: 'full length'
      })
      .select('id')
      .single();

    expect(draftInsert?.id).toBeTruthy();

    await adminSB.from('presentation_presenters').upsert({
      presentation_id: draftInsert!.id,
      presenter_id: user.userId
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

    const { data: draftInsert } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS edit abstract '.repeat(12),
        learning_points: 'No JS edit learning point '.repeat(4),
        submitter_id: user.userId,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: 'full length'
      })
      .select('id')
      .single();

    expect(draftInsert?.id).toBeTruthy();

    await adminSB.from('presentation_presenters').upsert({
      presentation_id: draftInsert!.id,
      presenter_id: user.userId
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

    const { data: existingDraft } = await adminSB
      .from('presentation_submissions')
      .insert({
        title,
        abstract: 'No JS duplicate existing abstract '.repeat(12),
        learning_points: 'No JS duplicate existing learning point '.repeat(4),
        submitter_id: user.userId,
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
        submitter_id: user.userId,
        year: submissionsForYear,
        is_submitted: false,
        presentation_type: '15 minutes'
      })
      .select('id')
      .single();

    await adminSB.from('presentation_presenters').upsert([
      {
        presentation_id: existingDraft!.id,
        presenter_id: user.userId
      },
      {
        presentation_id: editableDraft!.id,
        presenter_id: user.userId
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

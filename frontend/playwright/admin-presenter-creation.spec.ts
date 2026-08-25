import { test, expect } from '@playwright/test';
import { CreatePresenterPage } from './models/CreatePresenterPage';
import { submissionsForYear } from '@/app/configConstants';
import {
  cleanupUserByEmail,
  createAttendee,
  createPresenterAdmin,
  createSupabaseAdmin,
  generateTestEmail,
  getEmailsWithSubject,
  loginOnPage
} from './utils';
import type { SeededUser, TestEmailMessage } from './utils';

const buildTestTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

const WELCOME_SUBJECT = 'GLA Summit: An account has been created for you';
const ON_BEHALF_SUBJECT =
  'GLA Summit: A presentation has been submitted on your behalf';

const abstractText = 'An abstract written on the presenter behalf. '.repeat(4);
const learningPointsText = 'What attendees will learn from this. '.repeat(2);

test.describe('admin presenter creation panel access', () => {
  test('is not reachable when logged out', async ({ page }) => {
    await page.goto('/admin/create-presenter');
    await expect(page).toHaveURL(/\/access-denied/, { timeout: 15000 });
  });

  test('is not reachable by a signed-in user who is not on the allow-list', async ({
    page
  }) => {
    const attendee = await createAttendee();
    try {
      await page.goto('/');
      await loginOnPage(page, attendee.email);

      await page.goto('/admin/create-presenter');
      await expect(page).toHaveURL(/\/access-denied/, { timeout: 15000 });
      await expect(
        page.getByRole('button', { name: 'Create Presenter and Submit' })
      ).toBeHidden();
    } finally {
      await attendee.cleanup();
    }
  });
});

test.describe('admin presenter creation panel', () => {
  // The admin is also an organizer so a single handle can both use the panel and
  // open /review-submissions to confirm the submission entered the normal flow.
  let adminUser: SeededUser;
  // Presenters the panel creates have no factory handle of their own, so the
  // spec records their addresses and tears them down by email.
  let createdPresenterEmails: string[] = [];

  test.beforeEach(async ({ page }) => {
    adminUser = await createPresenterAdmin({ alsoOrganizer: true });
    await page.goto('/');
    await loginOnPage(page, adminUser.email);
  });

  test.afterEach(async () => {
    for (const email of createdPresenterEmails) {
      await cleanupUserByEmail(email);
    }
    createdPresenterEmails = [];
    await adminUser?.cleanup();
  });

  test('renders the form for an allow-listed admin', async ({ page }) => {
    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await expect(
      page.getByRole('heading', { name: 'Create a Presenter' })
    ).toBeVisible();
    await expect(formPage.emailInput).toBeVisible();
    await expect(formPage.titleInput).toBeVisible();
    await expect(formPage.abstractInput).toBeVisible();
  });

  test('creates the presenter and files the submission under them, not the admin', async ({
    page
  }) => {
    const presenterEmail = generateTestEmail('pw-created-presenter');
    createdPresenterEmails.push(presenterEmail);
    const testTitle = buildTestTitle('On behalf submission');

    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      firstName: 'Created',
      lastName: 'Presenter',
      email: presenterEmail,
      title: testTitle,
      abstract: abstractText,
      learningPoints: learningPointsText,
      presentationType: '15 minutes'
    });

    await formPage.submitForm();
    await formPage.waitForSuccess('Created Presenter');

    const adminSB = createSupabaseAdmin();

    // The presenter account exists, with the name the admin entered.
    const { data: lookup } = await adminSB
      .from('account_emails')
      .select('user_id')
      .eq('email', presenterEmail)
      .single();
    expect(lookup?.user_id).toBeTruthy();
    const newPresenterId = lookup!.user_id;
    expect(newPresenterId).not.toEqual(adminUser.userId);

    const { data: profile } = await adminSB
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', newPresenterId)
      .single();
    expect(profile?.firstname).toEqual('Created');
    expect(profile?.lastname).toEqual('Presenter');

    // The submission is owned by the new presenter — this is the whole point of
    // the panel, so assert both the positive and the negative.
    const { data: submission } = await adminSB
      .from('presentation_submissions')
      .select('id, submitter_id, is_submitted, year, presentation_type, abstract')
      .eq('title', testTitle)
      .single();
    expect(submission?.submitter_id).toEqual(newPresenterId);
    expect(submission?.submitter_id).not.toEqual(adminUser.userId);
    expect(submission?.is_submitted).toEqual(true);
    expect(submission?.year).toEqual(submissionsForYear);
    expect(submission?.presentation_type).toEqual('15 minutes');

    // ...and the presenter link points at the presenter, again not the admin.
    const { data: presenters } = await adminSB
      .from('presentation_presenters')
      .select('presenter_id, status')
      .eq('presentation_id', submission!.id);
    expect(presenters).toHaveLength(1);
    expect(presenters?.[0].presenter_id).toEqual(newPresenterId);
    expect(presenters?.[0].status).toEqual('accepted');

    // The admin must not have acquired a submission of their own.
    const { data: adminSubmissions } = await adminSB
      .from('presentation_submissions')
      .select('id')
      .eq('submitter_id', adminUser.userId);
    expect(adminSubmissions ?? []).toHaveLength(0);
  });

  test('emails the new presenter a welcome and an on-behalf submission notice', async ({
    page
  }) => {
    const presenterEmail = generateTestEmail('pw-presenter-emails');
    createdPresenterEmails.push(presenterEmail);
    const testTitle = buildTestTitle('Emailed on behalf');

    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      firstName: 'Mailed',
      lastName: 'Presenter',
      email: presenterEmail,
      title: testTitle,
      abstract: abstractText,
      learningPoints: learningPointsText
    });

    // Fixed lower bound captured before the action that sends the mail; the 5s
    // grace absorbs Mailpit's whole-second Date truncation and clock skew, and
    // the unique title keeps the wider window free of false positives. See the
    // same note in presentation-submission.spec.ts.
    const emailSentAfter = Date.now() - 5000;
    await formPage.submitForm();
    await formPage.waitForSuccess('Mailed Presenter');

    await expect(async () => {
      const welcomeEmails = await getEmailsWithSubject(
        presenterEmail,
        WELCOME_SUBJECT,
        emailSentAfter
      );
      expect(welcomeEmails.length).toEqual(1);
      // The welcome email must carry a way in: a verification link and a code.
      expect(welcomeEmails[0].body.html).toContain('/auth/validateLogin');
    }).toPass({ timeout: 15000 });

    const mentionsSubmission = (email: TestEmailMessage) =>
      email.body.html.includes(testTitle) &&
      email.body.html.includes('on your behalf');

    await expect(async () => {
      const onBehalfEmails = await getEmailsWithSubject(
        presenterEmail,
        ON_BEHALF_SUBJECT,
        emailSentAfter
      ).then((emails) => emails.filter(mentionsSubmission));
      expect(onBehalfEmails.length).toEqual(1);
    }).toPass({ timeout: 15000 });
  });

  test('the passcode in the welcome email signs the new presenter in', async ({
    page,
    context
  }) => {
    const presenterEmail = generateTestEmail('pw-presenter-otp');
    createdPresenterEmails.push(presenterEmail);
    const testTitle = buildTestTitle('Passcode works');

    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      firstName: 'Verified',
      lastName: 'Presenter',
      email: presenterEmail,
      title: testTitle,
      abstract: abstractText
    });

    const emailSentAfter = Date.now() - 5000;
    await formPage.submitForm();
    await formPage.waitForSuccess('Verified Presenter');

    // Read the passcode out of the welcome email itself rather than trusting the
    // action: this is the assertion that the code an admin-created presenter
    // actually receives is one the verify form accepts. The OTP is the only
    // 6-to-8 digit run in the body (the year is four digits), so a bare
    // digit-run match is unambiguous here.
    let otp: string | undefined;
    await expect(async () => {
      const [welcome] = await getEmailsWithSubject(
        presenterEmail,
        WELCOME_SUBJECT,
        emailSentAfter
      );
      expect(welcome).toBeTruthy();
      otp = welcome.body.text.match(/\b(\d{6,8})\b/)?.[1];
      expect(otp).toBeTruthy();
    }).toPass({ timeout: 15000 });

    // Two things make this leg easy to get wrong by hand:
    //  1. /auth/validateLogin redirects a signed-in visitor away, and the admin
    //     who just used the panel IS signed in — so clear the session first.
    //  2. The email's button points at https://glasummit.org (as every template
    //     does), so a locally-issued code entered there can never validate.
    //     Navigate to the *local* route with the same query the email carries.
    await context.clearCookies();
    await page.goto(
      `/auth/validateLogin?email=${encodeURIComponent(presenterEmail)}`
    );

    await page
      .getByRole('textbox', { name: 'Verification Code' })
      .fill(otp as string);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();

    // Signed in — and as the presenter, not the admin who created them.
    // The menu button renders "<firstname> <lastname>" for the session's profile.
    const userButton = page.locator('[data-testid="user-menu-button"]');
    await userButton.waitFor({ state: 'visible', timeout: 20000 });
    await expect(userButton).toContainText('Verified Presenter');
    await expect(userButton).not.toContainText(
      `${adminUser.firstName} ${adminUser.lastName}`
    );
  });

  test('stores the optional bio and profile picture on the new presenter', async ({
    page
  }) => {
    const presenterEmail = generateTestEmail('pw-presenter-profile');
    createdPresenterEmails.push(presenterEmail);
    const testTitle = buildTestTitle('Profile details');
    const bio = 'A biography supplied by the organizer on the presenter behalf.';

    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      firstName: 'Pictured',
      lastName: 'Presenter',
      email: presenterEmail,
      bio,
      title: testTitle,
      abstract: abstractText
    });
    await formPage.attachProfileImage();

    await formPage.submitForm();
    await formPage.waitForSuccess('Pictured Presenter');

    const adminSB = createSupabaseAdmin();
    const { data: lookup } = await adminSB
      .from('account_emails')
      .select('user_id')
      .eq('email', presenterEmail)
      .single();

    const { data: profile } = await adminSB
      .from('profiles')
      .select('bio, avatar_url')
      .eq('id', lookup!.user_id)
      .single();

    expect(profile?.bio).toEqual(bio);
    expect(profile?.avatar_url).toBeTruthy();

    // The stored path must actually resolve to an object in the bucket.
    const { data: downloaded, error: downloadError } = await adminSB.storage
      .from('avatars')
      .download(profile!.avatar_url!);
    expect(downloadError).toBeNull();
    expect(downloaded).toBeTruthy();
  });

  test('refuses an email address that already has an account', async ({
    page
  }) => {
    const existing = await createAttendee({ emailPrefix: 'pw-existing-user' });
    try {
      const formPage = new CreatePresenterPage(page);
      await formPage.goto();
      await formPage.waitForFormLoad();

      const testTitle = buildTestTitle('Duplicate account');
      await formPage.fillFormData({
        firstName: 'Duplicate',
        lastName: 'Presenter',
        email: existing.email,
        title: testTitle,
        abstract: abstractText
      });

      await formPage.submitForm();
      await formPage.waitForError(/account already exists/i);

      // Nothing was written for the rejected attempt.
      const adminSB = createSupabaseAdmin();
      const { data: submissions } = await adminSB
        .from('presentation_submissions')
        .select('id')
        .eq('title', testTitle);
      expect(submissions ?? []).toHaveLength(0);
    } finally {
      await existing.cleanup();
    }
  });

  test('keeps the entered values when validation fails', async ({ page }) => {
    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    const testTitle = buildTestTitle('Short abstract');
    await formPage.fillFormData({
      firstName: 'Invalid',
      lastName: 'Presenter',
      email: generateTestEmail('pw-never-created'),
      title: testTitle,
      // Below the 100-character minimum the presenter-facing form also enforces.
      abstract: 'Too short.'
    });

    await formPage.submitForm();

    await expect(
      page.getByText('Abstract must be at least 100 characters')
    ).toBeVisible({ timeout: 15000 });
    await expect(formPage.titleInput).toHaveValue(testTitle);
    await expect(formPage.firstNameInput).toHaveValue('Invalid');
  });

  test('the on-behalf submission enters the normal review flow', async ({
    page
  }) => {
    const presenterEmail = generateTestEmail('pw-review-presenter');
    createdPresenterEmails.push(presenterEmail);
    const testTitle = buildTestTitle('Reviewable on behalf');

    const formPage = new CreatePresenterPage(page);
    await formPage.goto();
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      firstName: 'Reviewable',
      lastName: 'Presenter',
      email: presenterEmail,
      title: testTitle,
      abstract: abstractText,
      learningPoints: learningPointsText
    });

    await formPage.submitForm();
    await formPage.waitForSuccess('Reviewable Presenter');

    // The acting admin is also an organizer for this spec, so the submission
    // should now be visible to them under review, attributed to the presenter.
    await page.goto('/review-submissions');
    await expect(
      page.getByRole('heading', { name: /Under review/ })
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(testTitle, { exact: false })).toBeVisible({
      timeout: 20000
    });
    await expect(
      page.getByText('Reviewable Presenter', { exact: false }).first()
    ).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import {
  createAttendee,
  createSupabaseAdmin,
  getEmailsWithSubject,
  loginOnPage
} from './utils';
import type { SeededUser, TestEmailMessage } from './utils';
import { submissionsForYear, COPRESENTER_INVITE_WORKFLOW } from '@/app/configConstants';
import { generateInviteToken } from '@/lib/copresenterInviteToken';
import { CopresenterInvitePage } from './models/CopresenterInvitePage';

// The accept/decline workflow ships inert behind COPRESENTER_INVITE_WORKFLOW.
// While it is off, the route 404s and no invites are sent, so these end-to-end
// expectations cannot hold. Re-enable by flipping the flag (and setting a key).
test.beforeEach(() => {
  test.skip(
    !COPRESENTER_INVITE_WORKFLOW,
    'Co-presenter accept/decline workflow is disabled (COPRESENTER_INVITE_WORKFLOW=false)'
  );
});

const buildTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

// Seed a submission owned by submitterId with copresenterId attached at the
// given invite status. The submitter/copresenter are script-created attendees;
// becoming an accepted/declined co-presenter is what the workflow under test
// drives. Cleanup is handled by the users' own cleanup() in afterEach (deleting
// the submitter cascades the submission + presenter links).
const seedInvite = async (params: {
  title: string;
  submitterId: string;
  copresenterId: string;
  copresenterStatus?: 'pending' | 'accepted' | 'declined';
  copresenterDeclinedCount?: number;
  isSubmitted?: boolean;
  // When true, also marks the presentation as accepted (accepted_presentations),
  // which is the precondition for any of its presenters to appear on the public
  // /presenters list.
  accepted?: boolean;
}): Promise<{ presentationId: string }> => {
  const admin = createSupabaseAdmin();
  const {
    title,
    submitterId,
    copresenterId,
    copresenterStatus = 'pending',
    copresenterDeclinedCount = 0,
    isSubmitted = false,
    accepted = false
  } = params;

  const { data: presentation, error: insertError } = await admin
    .from('presentation_submissions')
    .insert({
      title,
      abstract: 'E2E copresenter invite test abstract. '.repeat(5),
      learning_points: 'E2E copresenter invite test learning points. '.repeat(3),
      submitter_id: submitterId,
      year: submissionsForYear,
      is_submitted: isSubmitted,
      presentation_type: 'full length'
    })
    .select('id')
    .single();

  if (insertError || !presentation)
    throw new Error(`Failed to create test presentation: ${insertError?.message}`);

  await admin.from('presentation_presenters').insert([
    { presentation_id: presentation.id, presenter_id: submitterId, status: 'accepted' },
    {
      presentation_id: presentation.id,
      presenter_id: copresenterId,
      status: copresenterStatus,
      declined_count: copresenterDeclinedCount
    }
  ]);

  if (accepted) {
    await admin
      .from('accepted_presentations')
      .insert({ id: presentation.id, year: submissionsForYear });
  }

  return { presentationId: presentation.id };
};

// Tests where the co-presenter is logged in
test.describe('copresenter invite — presenter logged in', () => {
  let submitter: SeededUser;
  let copresenter: SeededUser;

  test.beforeEach(async () => {
    [submitter, copresenter] = await Promise.all([
      createAttendee({ emailPrefix: 'pw-cp-submitter' }),
      createAttendee({ emailPrefix: 'pw-cp-copresenter' })
    ]);
  });

  test.afterEach(async () => {
    await submitter?.cleanup();
    await copresenter?.cleanup();
  });

  test(
    'accept: updates status to accepted and notifies submitter',
    { tag: ['@smoke', '@copresenter'] },
    async ({ page }) => {
      const title = buildTitle('CP Invite Accept');
      const seeded = await seedInvite({
        title,
        submitterId: submitter.userId,
        copresenterId: copresenter.userId
      });
      const token = generateInviteToken(seeded.presentationId, copresenter.userId);
      const invitePage = new CopresenterInvitePage(page);

      await page.goto('/');
      await loginOnPage(page, copresenter.email);
      await invitePage.goto(token);
      await invitePage.waitForInvitePage();
      await expect(invitePage.presentationTitle()).toHaveText(title);

      // Fixed anchor captured before accept (the action that sends the email),
      // so the toPass loop below cannot slide past an already-delivered email.
      const emailSentAfter = Date.now();
      await invitePage.accept();

      // Submitter receives notification email
      const matchesExpectation = (email: TestEmailMessage) =>
        email.body.html.includes(title);

      await expect(async () => {
        const matchingEmails = await getEmailsWithSubject(
          submitter.email,
          'GLA Summit: Co-presenter accepted your invitation',
          emailSentAfter
        ).then((emails) => emails.filter(matchesExpectation));

        expect(matchingEmails.length).toEqual(1);
      }).toPass({ timeout: 10000 });

      // DB row updated
      const admin = createSupabaseAdmin();
      const { data: row } = await admin
        .from('presentation_presenters')
        .select('status')
        .eq('presentation_id', seeded.presentationId)
        .eq('presenter_id', copresenter.userId)
        .single();
      expect(row?.status).toBe('accepted');
    }
  );

  test(
    'decline: updates status, increments declined_count, notifies submitter',
    { tag: '@copresenter' },
    async ({ page }) => {
      const title = buildTitle('CP Invite Decline');
      const seeded = await seedInvite({
        title,
        submitterId: submitter.userId,
        copresenterId: copresenter.userId
      });
      const token = generateInviteToken(seeded.presentationId, copresenter.userId);
      const invitePage = new CopresenterInvitePage(page);

      await page.goto('/');
      await loginOnPage(page, copresenter.email);
      await invitePage.goto(token);
      await invitePage.waitForInvitePage();

      // Fixed anchor captured before decline (the action that sends the email),
      // so the toPass loop below cannot slide past an already-delivered email.
      const emailSentAfter = Date.now();
      await invitePage.decline();

      // Submitter receives notification email
      const matchesExpectation = (email: TestEmailMessage) =>
        email.body.html.includes(title);

      await expect(async () => {
        const matchingEmails = await getEmailsWithSubject(
          submitter.email,
          'GLA Summit: Co-presenter declined your invitation',
          emailSentAfter
        ).then((emails) => emails.filter(matchesExpectation));

        expect(matchingEmails.length).toEqual(1);
      }).toPass({ timeout: 10000 });

      // DB row updated
      const admin = createSupabaseAdmin();
      const { data: row } = await admin
        .from('presentation_presenters')
        .select('status, declined_count')
        .eq('presentation_id', seeded.presentationId)
        .eq('presenter_id', copresenter.userId)
        .single();
      expect(row?.status).toBe('declined');
      expect(row?.declined_count).toBe(1);
    }
  );

  test('already-responded: shows confirmation and hides response buttons', {
    tag: '@copresenter'
  }, async ({ page }) => {
    const title = buildTitle('CP Invite Already Responded');
    const seeded = await seedInvite({
      title,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      copresenterStatus: 'accepted'
    });
    const token = generateInviteToken(seeded.presentationId, copresenter.userId);
    const invitePage = new CopresenterInvitePage(page);

    await loginOnPage(page, copresenter.email);
    await invitePage.goto(token);

    await expect(page.getByText(/you have already/i)).toBeVisible();
    expect(await invitePage.hasResponseButtons()).toBe(false);
  });
});

// Tests where the submitter is logged in
test.describe('copresenter invite — submitter/attendee logged in', () => {
  let submitter: SeededUser;
  let copresenter: SeededUser;

  test.beforeEach(async () => {
    [submitter, copresenter] = await Promise.all([
      createAttendee({ emailPrefix: 'pw-cp-submitter' }),
      createAttendee({ emailPrefix: 'pw-cp-copresenter' })
    ]);
  });

  test.afterEach(async () => {
    await submitter?.cleanup();
    await copresenter?.cleanup();
  });

  test('wrong-user guard: shows error for the wrong logged-in account', {
    tag: '@copresenter'
  }, async ({ page }) => {
    const title = buildTitle('CP Invite Wrong User');
    const seeded = await seedInvite({
      title,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId
    });
    // Token is for the copresenter, but the submitter is logged in
    const token = generateInviteToken(seeded.presentationId, copresenter.userId);
    const invitePage = new CopresenterInvitePage(page);

    await page.goto('/');
    await loginOnPage(page, submitter.email);
    await invitePage.goto(token);

    expect(await invitePage.isWrongAccount()).toBe(true);
    expect(await invitePage.hasResponseButtons()).toBe(false);
  });

  test(
    'submitter sees pending badge before copresenter responds',
    { tag: '@copresenter' },
    async ({ page }) => {
      // Seed as submitted so the card has aria-label (PastPresentationSubmissions)
      const title = buildTitle('CP Invite Pending Badge');
      await seedInvite({
        title,
        submitterId: submitter.userId,
        copresenterId: copresenter.userId,
        copresenterStatus: 'pending',
        isSubmitted: true
      });

      await page.goto('/');
      await loginOnPage(page, submitter.email);
      await page.goto('/my-presentations');
      const card = page.locator(`[aria-label="${title}"]`).first();
      await expect(card).toBeVisible();
      await expect(card.getByText('Pending', { exact: true })).toBeVisible();
    }
  );

  test('submitter sees declined badge after copresenter declines', {
    tag: '@copresenter'
  }, async ({ page }) => {
    const title = buildTitle('CP Invite Declined Badge');
    await seedInvite({
      title,
      submitterId: submitter.userId,
      copresenterId: copresenter.userId,
      copresenterStatus: 'declined',
      isSubmitted: true
    });

    await page.goto('/');
    await loginOnPage(page, submitter.email);
    await page.goto('/my-presentations');
    const card = page.locator(`[aria-label="${title}"]`).first();
    await expect(card).toBeVisible();
    await expect(card.getByText('Declined', { exact: true })).toBeVisible();
  });
});

// Accepting an invite must surface the co-presenter on the public /presenters
// list. That list is filtered to status='accepted' and cached for weeks
// (getAcceptedPresenterIds), so this also exercises the cache revalidation that
// respondToInvite performs — without it the primed (pending) list would stay
// stale and the presenter would never appear.
test(
  'accept: co-presenter appears on the public presenters page after revalidation',
  { tag: '@copresenter' },
  async ({ page }) => {
    // A unique name so we can assert on exactly this presenter among any others
    // already accepted in the database. New co-presenters added via the form have
    // blank names; here the invitee has set a profile name (as an existing user
    // would), which is the case where they are eligible to be shown at all.
    const uniqueLast = `Pubcp${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
    const submitter = await createAttendee({ emailPrefix: 'pw-cp-pubsub' });
    const copresenter = await createAttendee({
      emailPrefix: 'pw-cp-pubcp',
      firstName: 'Accepted',
      lastName: uniqueLast
    });

    try {
      const title = buildTitle('CP Public Presenters');
      const seeded = await seedInvite({
        title,
        submitterId: submitter.userId,
        copresenterId: copresenter.userId,
        copresenterStatus: 'pending',
        isSubmitted: true,
        accepted: true
      });

      // Prime the weeks-cached list while still pending: must be absent.
      await page.goto('/presenters');
      await expect(page.getByText(uniqueLast)).toHaveCount(0);

      const token = generateInviteToken(seeded.presentationId, copresenter.userId);
      const invitePage = new CopresenterInvitePage(page);
      await page.goto('/');
      await loginOnPage(page, copresenter.email);
      await invitePage.goto(token);
      await invitePage.waitForInvitePage();
      await invitePage.accept();

      // After accepting + revalidation, the presenter must appear.
      await expect(async () => {
        await page.goto('/presenters');
        await expect(page.getByText(uniqueLast).first()).toBeVisible();
      }).toPass({ timeout: 10000 });
    } finally {
      await submitter.cleanup();
      await copresenter.cleanup();
    }
  }
);

// No auth required — invalid token is caught before auth check
test('invalid token: shows error page', { tag: '@copresenter' }, async ({ page }) => {
  const invitePage = new CopresenterInvitePage(page);
  await invitePage.goto('not-a-valid-token');
  expect(await invitePage.isInvalidToken()).toBe(true);
});

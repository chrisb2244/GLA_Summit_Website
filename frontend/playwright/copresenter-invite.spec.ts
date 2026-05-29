import { test, expect } from '@playwright/test';
import path from 'path';
import { createSupabaseAdmin, getEmailsWithSubject } from './utils';
import { submissionsForYear, COPRESENTER_INVITE_WORKFLOW } from '@/app/configConstants';
import { generateInviteToken } from '@/lib/copresenterInviteToken';
import { CopresenterInvitePage } from './models/CopresenterInvitePage';
import { MessageModel } from 'inbucket-js-client';

// The accept/decline workflow ships inert behind COPRESENTER_INVITE_WORKFLOW.
// While it is off, the route 404s and no invites are sent, so these end-to-end
// expectations cannot hold. Re-enable by flipping the flag (and setting a key).
test.beforeEach(() => {
  test.skip(
    !COPRESENTER_INVITE_WORKFLOW,
    'Co-presenter accept/decline workflow is disabled (COPRESENTER_INVITE_WORKFLOW=false)'
  );
});

// TEST_ATTENDEE_EMAIL acts as the submitter; TEST_PRESENTER_EMAIL acts as co-presenter.
const submitterEmail = process.env.TEST_ATTENDEE_EMAIL as string;
const copresenterEmail = process.env.TEST_PRESENTER_EMAIL as string;

const attendeeStorageState = path.resolve(__dirname, '.auth', 'attendee.json');
const presenterStorageState = path.resolve(__dirname, '.auth', 'presenter.json');

const buildTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

type SeededInvite = {
  presentationId: string;
  submitterId: string;
  copresenterId: string;
  cleanup: () => Promise<void>;
};

const seedInvite = async (
  title: string,
  copresenterStatus: 'pending' | 'accepted' | 'declined' = 'pending',
  isSubmitted = false
): Promise<SeededInvite> => {
  const admin = createSupabaseAdmin();

  const { data: users, error } = await admin
    .from('email_lookup')
    .select('id, email')
    .in('email', [submitterEmail, copresenterEmail]);

  if (error || !users)
    throw new Error(`Failed to look up test users: ${error?.message}`);

  const submitter = users.find((u) => u.email === submitterEmail);
  const copresenter = users.find((u) => u.email === copresenterEmail);
  if (!submitter || !copresenter)
    throw new Error('Could not find test users in email_lookup');

  const { data: presentation, error: insertError } = await admin
    .from('presentation_submissions')
    .insert({
      title,
      abstract: 'E2E copresenter invite test abstract. '.repeat(5),
      learning_points: 'E2E copresenter invite test learning points. '.repeat(3),
      submitter_id: submitter.id,
      year: submissionsForYear,
      is_submitted: isSubmitted,
      presentation_type: 'full length'
    })
    .select('id')
    .single();

  if (insertError || !presentation)
    throw new Error(`Failed to create test presentation: ${insertError?.message}`);

  await admin.from('presentation_presenters').insert([
    { presentation_id: presentation.id, presenter_id: submitter.id, status: 'accepted' },
    { presentation_id: presentation.id, presenter_id: copresenter.id, status: copresenterStatus }
  ]);

  return {
    presentationId: presentation.id,
    submitterId: submitter.id,
    copresenterId: copresenter.id,
    cleanup: async () => {
      await admin.from('presentation_submissions').delete().eq('id', presentation.id);
    }
  };
};

// Tests where the co-presenter (presenter account) is logged in
test.describe('copresenter invite — presenter logged in', () => {
  test.use({ storageState: presenterStorageState });

  test(
    '@smoke @copresenter accept: updates status to accepted and notifies submitter',
    async ({ page }) => {
      const title = buildTitle('CP Invite Accept');
      const seeded = await seedInvite(title);
      const token = generateInviteToken(seeded.presentationId, seeded.copresenterId);
      const invitePage = new CopresenterInvitePage(page);

      try {
        await invitePage.goto(token);
        await invitePage.waitForInvitePage();
        await expect(invitePage.presentationTitle()).toHaveText(title);

        // Fixed anchor captured before accept (the action that sends the email),
        // so the toPass loop below cannot slide past an already-delivered email.
        const emailSentAfter = Date.now();
        await invitePage.accept();

        // Submitter receives notification email
        const submitterMailbox = submitterEmail.split('@')[0];

        const matchesExpectation = (email: MessageModel) =>
          email.body.html.includes(title);

        await expect(async () => {
          const matchingEmails = await getEmailsWithSubject(
            submitterMailbox,
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
          .eq('presenter_id', seeded.copresenterId)
          .single();
        expect(row?.status).toBe('accepted');
      } finally {
        await seeded.cleanup();
      }
    }
  );

  test(
    '@smoke @copresenter decline: updates status, increments declined_count, notifies submitter',
    async ({ page }) => {
      const title = buildTitle('CP Invite Decline');
      const seeded = await seedInvite(title);
      const token = generateInviteToken(seeded.presentationId, seeded.copresenterId);
      const invitePage = new CopresenterInvitePage(page);

      try {
        await invitePage.goto(token);
        await invitePage.waitForInvitePage();

        // Fixed anchor captured before decline (the action that sends the email),
        // so the toPass loop below cannot slide past an already-delivered email.
        const emailSentAfter = Date.now();
        await invitePage.decline();

        // Submitter receives notification email
        const submitterMailbox = submitterEmail.split('@')[0];

        const matchesExpectation = (email: MessageModel) =>
          email.body.html.includes(title);

        await expect(async () => {
          const matchingEmails = await getEmailsWithSubject(
            submitterMailbox,
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
          .eq('presenter_id', seeded.copresenterId)
          .single();
        expect(row?.status).toBe('declined');
        expect(row?.declined_count).toBe(1);
      } finally {
        await seeded.cleanup();
      }
    }
  );

  test('@copresenter already-responded: shows confirmation and hides response buttons', async ({
    page
  }) => {
    const title = buildTitle('CP Invite Already Responded');
    const seeded = await seedInvite(title, 'accepted');
    const token = generateInviteToken(seeded.presentationId, seeded.copresenterId);
    const invitePage = new CopresenterInvitePage(page);

    try {
      await invitePage.goto(token);

      await expect(page.getByText(/you have already/i)).toBeVisible();
      expect(await invitePage.hasResponseButtons()).toBe(false);
    } finally {
      await seeded.cleanup();
    }
  });
});

// Tests where the submitter (attendee account) is logged in
test.describe('copresenter invite — submitter/attendee logged in', () => {
  test.use({ storageState: attendeeStorageState });

  test('@copresenter wrong-user guard: shows error for the wrong logged-in account', async ({
    page
  }) => {
    const title = buildTitle('CP Invite Wrong User');
    const seeded = await seedInvite(title);
    // Token is for the presenter, but the attendee is logged in
    const token = generateInviteToken(seeded.presentationId, seeded.copresenterId);
    const invitePage = new CopresenterInvitePage(page);

    try {
      await invitePage.goto(token);

      expect(await invitePage.isWrongAccount()).toBe(true);
      expect(await invitePage.hasResponseButtons()).toBe(false);
    } finally {
      await seeded.cleanup();
    }
  });

  test(
    '@smoke @copresenter submitter sees pending badge before copresenter responds',
    async ({ page }) => {
      // Seed as submitted so the card has aria-label (PastPresentationSubmissions)
      const title = buildTitle('CP Invite Pending Badge');
      const seeded = await seedInvite(title, 'pending', true);

      try {
        await page.goto('/my-presentations');
        const card = page.locator(`[aria-label="${title}"]`).first();
        await expect(card).toBeVisible();
        await expect(card.getByText('Pending', { exact: true })).toBeVisible();
      } finally {
        await seeded.cleanup();
      }
    }
  );

  test('@copresenter submitter sees declined badge after copresenter declines', async ({
    page
  }) => {
    const title = buildTitle('CP Invite Declined Badge');
    const seeded = await seedInvite(title, 'declined', true);

    try {
      await page.goto('/my-presentations');
      const card = page.locator(`[aria-label="${title}"]`).first();
      await expect(card).toBeVisible();
      await expect(card.getByText('Declined', { exact: true })).toBeVisible();
    } finally {
      await seeded.cleanup();
    }
  });
});

// No auth required — invalid token is caught before auth check
test('@copresenter invalid token: shows error page', async ({ page }) => {
  const invitePage = new CopresenterInvitePage(page);
  await invitePage.goto('not-a-valid-token');
  expect(await invitePage.isInvalidToken()).toBe(true);
});

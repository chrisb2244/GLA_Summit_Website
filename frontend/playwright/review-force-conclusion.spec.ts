import { test, expect } from '@playwright/test';
import {
  authStatePath,
  createPresenter,
  getEmailsWithSubject
} from './utils';
import type { SeededUser } from './utils';
import { submissionsForYear } from '@/app/configConstants';
import {
  ACCEPTED_EMAIL_SUBJECT,
  REJECTED_EMAIL_SUBJECT
} from '@/EmailTemplates/PresentationOutcomeEmail';

const uniqueTitle = (prefix: string) =>
  `${prefix} ${Date.now()} ${Math.random().toString(16).slice(2, 8)}`;

// An under-review submission is a submitted-but-not-accepted presentation for the
// active submission year, so it shows in the review page's "Under review" bucket.
const seedUnderReviewPresenter = (title: string) =>
  createPresenter({
    emailPrefix: 'pw-force',
    accepted: false,
    year: submissionsForYear,
    title
  });

test.describe('force early conclusion', { tag: '@regression' }, () => {
  let presenter: SeededUser;

  test.afterEach(async () => {
    await presenter?.cleanup();
  });

  // The concluder allow-list is admin-only, so this uses the storageState of
  // the seed-installed concluder (minted by auth.setup.ts, skipped when the
  // TEST_CONCLUDER_* env vars are absent — mirror that skip here). The forced
  // conclusion mutates only the per-test presenter's submission, which the
  // afterEach tears down, so sharing the concluder session is pollution-free.
  test.describe('as the seeded concluder', () => {
    test.skip(
      !process.env.TEST_CONCLUDER_EMAIL || !process.env.TEST_CONCLUDER_USER_ID,
      'TEST_CONCLUDER_* env vars are not set'
    );
    test.use({ storageState: authStatePath('concluder') });

    test('an allow-listed organizer forces an accept and sees the audit trail', async ({
      page
    }) => {
      const title = uniqueTitle('Concludable talk');
      presenter = await seedUnderReviewPresenter(title);

      await page.goto('/review-submissions');

      // Other under-review submissions also show force buttons, so scope to the
      // innermost card column that contains BOTH this title and a force button.
      // Exact name matching avoids colliding with the card's expander button.
      const forceAccept = page.getByRole('button', {
        name: 'Force accept',
        exact: true
      });
      const card = page
        .locator('div')
        .filter({ hasText: title })
        .filter({ has: forceAccept })
        .last();
      await card
        .getByRole('button', { name: 'Force accept', exact: true })
        .click();

      // Confirm in the CenteredDialog (scope to the dialog to avoid the trigger).
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('irreversible');
      await dialog
        .getByRole('button', { name: 'Force accept', exact: true })
        .click();

      // The panel only unmounts when the action reports success, and stays up
      // with the reason when it does not. Asserting that first splits the two
      // failure modes that otherwise both surface as "audit line never appeared":
      // a rejected/no-op write leaves the panel up with its error, whereas a page
      // that never picked up the write closes it and shows nothing new.
      //
      // Anchor on the panel heading, not `dialog`: CenteredDialog's root carries
      // role="dialog" but is `relative` with only `fixed` children, so it has an
      // empty box and Playwright reports it hidden even while the dialog is on
      // screen -- expect(dialog).toBeHidden() would pass unconditionally.
      await expect(
        page.getByRole('heading', { name: 'Force accept this submission?' })
      ).toBeHidden();

      // Scope the audit line to THIS submission's card. A page-wide
      // getByText(/Forced accepted by/) also matches the audit line of any other
      // forced submission on the page -- including long-lived ones on seeded
      // presentations that no test tears down -- so it passes even when this
      // force wrote nothing. Requiring the audit text and this title's heading
      // inside the same element ties the assertion to the submission under test;
      // .last() picks the innermost such element (the card column) rather than
      // the page wrapper, which contains every card.
      //
      // Reload before asserting: the write is durable by the time the action
      // returns, but the page it re-renders in response is not reliably fresh.
      // Measured locally at ~50% stale over 10 runs, unchanged by revalidatePath,
      // refresh() or a client-side router.refresh() -- so the immediate update is
      // a framework-level read-your-writes gap, not something this spec can wait
      // out (toBeVisible only re-queries the DOM; nothing re-renders it). Assert
      // the durable outcome here and track the refresh gap separately.
      await page.reload();

      const forcedCard = page
        .locator('div')
        .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
        .filter({ hasText: /Forced accepted by/ })
        .last();
      await expect(forcedCard).toBeVisible();
    });
  });

  // Any organizer outside the allow-list works here, so the shared organizer
  // session (never a concluder) reads the page.
  test.describe('as a plain organizer', () => {
    test.use({ storageState: authStatePath('organizer') });

    test('an organizer who is not a concluder sees no force buttons', async ({
      page
    }) => {
      const title = uniqueTitle('Plain review talk');
      presenter = await seedUnderReviewPresenter(title);

      await page.goto('/review-submissions');

      await expect(page.getByText(title)).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Force accept', exact: true })
      ).toHaveCount(0);
    });
  });
});

// The submission-outcome webhook emails every presenter. This exercises the real
// route → sendMail → Mailpit path (no mocks). It needs the same shared secret the
// app uses; skip cleanly when it is not configured for the test process.
test.describe('submission-outcome emails', { tag: '@regression' }, () => {
  const secret = process.env.SECRET_SUBMISSION_OUTCOME_TOKEN;
  let presenter: SeededUser;

  test.skip(
    !secret,
    'Set SECRET_SUBMISSION_OUTCOME_TOKEN in .env.test (matching .env.local) to run the outcome email tests.'
  );

  test.afterEach(async () => {
    await presenter?.cleanup();
  });

  const postOutcome = (
    request: import('@playwright/test').APIRequestContext,
    presentationId: string,
    outcome: 'accepted' | 'declined'
  ) =>
    request.post('/api/submission-outcome', {
      headers: { 'x-submission-outcome-secret': secret as string },
      data: { presentation_id: presentationId, outcome }
    });

  test('accepted outcome emails the presenter', async ({ request }) => {
    const title = uniqueTitle('Email accept');
    presenter = await seedUnderReviewPresenter(title);
    const sentAfter = Date.now() - 1000;

    const res = await postOutcome(
      request,
      presenter.presentationId!,
      'accepted'
    );
    expect(res.ok()).toBeTruthy();

    await expect(async () => {
      const emails = await getEmailsWithSubject(
        presenter.email,
        ACCEPTED_EMAIL_SUBJECT,
        sentAfter
      );
      expect(emails.length).toBeGreaterThanOrEqual(1);
      expect(emails[0].body.html).toContain(title);
    }).toPass({ timeout: 10000 });
  });

  test('declined outcome emails the presenter', async ({ request }) => {
    const title = uniqueTitle('Email decline');
    presenter = await seedUnderReviewPresenter(title);
    const sentAfter = Date.now() - 1000;

    const res = await postOutcome(
      request,
      presenter.presentationId!,
      'declined'
    );
    expect(res.ok()).toBeTruthy();

    await expect(async () => {
      const emails = await getEmailsWithSubject(
        presenter.email,
        REJECTED_EMAIL_SUBJECT,
        sentAfter
      );
      expect(emails.length).toBeGreaterThanOrEqual(1);
    }).toPass({ timeout: 10000 });
  });
});

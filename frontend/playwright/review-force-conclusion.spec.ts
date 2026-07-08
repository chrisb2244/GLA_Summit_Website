import { test, expect } from '@playwright/test';
import {
  createOrganizer,
  createPresenter,
  getEmailsWithSubject,
  getSeededConcluder,
  loginOnPage
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
  let concluder: SeededUser;
  let presenter: SeededUser;

  test.afterEach(async () => {
    await presenter?.cleanup();
    await concluder?.cleanup();
  });

  test('an allow-listed organizer forces an accept and sees the audit trail', async ({
    page
  }) => {
    const title = uniqueTitle('Concludable talk');
    // The concluder allow-list is admin-only, so tests reuse the concluder
    // installed by the DB seed rather than minting one (see getSeededConcluder).
    concluder = getSeededConcluder();
    presenter = await seedUnderReviewPresenter(title);

    await page.goto('/');
    await loginOnPage(page, concluder.email);
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

    // The submission moves to Accepted and the audit line records who forced it.
    await expect(page.getByText(/Forced accepted by/)).toBeVisible();
  });

  test('an organizer who is not a concluder sees no force buttons', async ({
    page
  }) => {
    const title = uniqueTitle('Plain review talk');
    [concluder, presenter] = await Promise.all([
      // Named `concluder` only for shared cleanup; this one is a plain organizer.
      createOrganizer({ emailPrefix: 'pw-plain-organizer' }),
      seedUnderReviewPresenter(title)
    ]);

    await page.goto('/');
    await loginOnPage(page, concluder.email);
    await page.goto('/review-submissions');

    await expect(page.getByText(title)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Force accept', exact: true })
    ).toHaveCount(0);
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

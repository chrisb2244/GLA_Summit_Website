import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import { createAttendee, createSupabaseAdmin, loginOnPage } from './utils';
import type { SeededUser } from './utils';
import { CAN_SUBMIT_PRESENTATION } from '@/app/configConstants';

const buildTitle = () =>
  `Draft RLS regression ${Date.now()} ${Math.random()
    .toString(16)
    .slice(2, 8)}`;

test.describe('draft save regression', { tag: '@regression' }, () => {
  // Creating the draft needs the new-submission form, which /my-presentations
  // only renders while CAN_SUBMIT_PRESENTATION is on — there is no other UI
  // route to a brand-new draft.
  test.skip(!CAN_SUBMIT_PRESENTATION, 'Presentation submission closed');

  let user: SeededUser;

  test.beforeEach(async ({ page }) => {
    user = await createAttendee();
    await page.goto('/');
    await loginOnPage(page, user.email);
  });

  test.afterEach(async () => {
    await user?.cleanup();
  });

  test('saving a draft does not fail with presentation_submissions RLS error', async ({
    page
  }) => {
    const admin = createSupabaseAdmin();
    const title = buildTitle();

    await page.goto('/my-presentations');

    const formPage = new PresentationSubmissionPage(page);
    await formPage.waitForFormLoad();

    await formPage.fillFormData({
      title,
      abstract: 'RLS regression abstract '.repeat(12),
      learningPoints: 'RLS regression learning points '.repeat(4),
      presentationType: '15 minutes',
      submitIntent: 'saveDraft'
    });
    await formPage.setSpeakerAgreement(true);

    await formPage.submitForm('Save Draft');

    await expect(
      page.getByText(
        /row-level security policy for table "presentation_submissions"/i
      )
    ).toHaveCount(0);

    await expect
      .poll(
        async () => {
          const { data } = await admin
            .from('presentation_submissions')
            .select('id, is_submitted')
            .eq('title', title)
            .maybeSingle();
          return data?.id ?? null;
        },
        { timeout: 20000 }
      )
      .not.toBeNull();

    await page.reload();
    await formPage.waitForDraftSaved(title);

    await expect(
      page.getByRole('link', { name: title, exact: true })
    ).toBeVisible();

    // The draft row is removed by the afterEach user cleanup (deleting the user
    // cascades their submissions), so no per-title delete is needed here.
  });
});

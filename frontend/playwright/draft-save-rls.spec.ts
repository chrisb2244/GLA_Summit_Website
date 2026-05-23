import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import { createSupabaseAdmin, loginOnPage } from './utils';
import { submissionsForYear } from '@/app/configConstants';
import path from 'path';

const attendeeEmail = process.env.TEST_ATTENDEE_EMAIL as string;

const buildTitle = () =>
  `Draft RLS regression ${Date.now()} ${Math.random()
    .toString(16)
    .slice(2, 8)}`;

test.describe('draft save regression', () => {
  test.use({
    storageState: async ({}, use) =>
      use(path.resolve(__dirname, '.auth', 'attendee.json'))
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
    await expect(page.getByText('Draft saved successfully!')).toBeVisible();

    await page
      .getByRole('button', { name: 'Submit another presentation' })
      .click();
    await expect(
      page.getByRole('link', { name: title, exact: true })
    ).toBeVisible();

    const { data: emailLookup } = await admin
      .from('email_lookup')
      .select('id')
      .eq('email', attendeeEmail)
      .single();

    if (emailLookup?.id) {
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('submitter_id', emailLookup.id)
        .eq('title', title)
        .eq('year', submissionsForYear);
    }
  });
});

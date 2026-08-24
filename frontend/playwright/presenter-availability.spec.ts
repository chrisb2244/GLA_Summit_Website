import { test, expect, type Page } from '@playwright/test';
import { createPresenter, createSupabaseAdmin, loginOnPage } from './utils';
import { submissionsForYear } from '@/app/configConstants';

// The summit is a 24-hour block from 12:00 UTC, so the grid's hours are fixed
// and addressable by index: 0 is 12:00 UTC, 4 is 16:00 UTC, and so on.
const SLOT_4_UTC = '2026-08-31T16:00:00.000Z';

const cell = (page: Page, index: number) =>
  page.locator(`[data-slot-index="${index}"]`);

const checkbox = (page: Page, index: number) =>
  cell(page, index).locator('input[type="checkbox"]');

/**
 * Sweep the mouse from one hour to another, the way a presenter picking a block
 * of the day would. Steps matter: the painter reads `pointermove`, so a single
 * jump would only ever land on the far end.
 */
const dragAcross = async (page: Page, fromIndex: number, toIndex: number) => {
  const from = await cell(page, fromIndex).boundingBox();
  const to = await cell(page, toIndex).boundingBox();
  if (from === null || to === null) {
    throw new Error('Availability cells are not laid out');
  }
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12
  });
  await page.mouse.up();
};

test.describe('presenter availability', () => {
  test('lets a presenter offer, save, and reload a block of hours', async ({
    page
  }) => {
    const presenter = await createPresenter({
      year: submissionsForYear,
      title: 'Availability Fixture Talk'
    });
    const admin = createSupabaseAdmin();

    try {
      // Put the presenter's accepted talk in one of the grid's hours: that hour
      // becomes theirs whether they like it or not.
      const { error: scheduleError } = await admin
        .from('accepted_presentations')
        .update({ scheduled_for: SLOT_4_UTC })
        .eq('id', presenter.presentationId!);
      expect(scheduleError).toBeNull();

      await page.goto('/');
      await loginOnPage(page, presenter.email);
      await page.goto('/my-profile');

      await expect(
        page.getByRole('heading', { name: 'When can you present?' })
      ).toBeVisible();
      await expect(page.locator('[data-slot-index]')).toHaveCount(24);

      // Every hour carries its UTC range, so there is no ambiguity about which
      // hour a cell is regardless of the viewer's zone.
      await expect(cell(page, 0)).toContainText('12:00–13:00 UTC');

      // The scheduled hour is locked on and cannot be given up.
      await expect(checkbox(page, 4)).toBeChecked();
      await expect(checkbox(page, 4)).toBeDisabled();
      await expect(cell(page, 4)).toContainText(
        'Scheduled: Availability Fixture Talk'
      );

      // A single hour toggles on click.
      await cell(page, 8).click();
      await expect(checkbox(page, 8)).toBeChecked();
      await cell(page, 8).click();
      await expect(checkbox(page, 8)).not.toBeChecked();

      // A drag paints the whole run it passes over, locked hour included.
      await dragAcross(page, 2, 6);
      for (const index of [2, 3, 4, 5, 6]) {
        await expect(checkbox(page, index)).toBeChecked();
      }
      await expect(checkbox(page, 1)).not.toBeChecked();
      await expect(checkbox(page, 7)).not.toBeChecked();

      await expect(page.getByText(/Offering 5 hours/)).toBeVisible();

      await page.getByRole('button', { name: 'Save availability' }).click();
      await expect(page.getByText('Availability saved.')).toBeVisible();

      // The hours survive a round trip through the database.
      await page.reload();
      await expect(page.locator('[data-slot-index]')).toHaveCount(24);
      for (const index of [2, 3, 4, 5, 6]) {
        await expect(checkbox(page, index)).toBeChecked();
      }
      for (const index of [0, 1, 7, 23]) {
        await expect(checkbox(page, index)).not.toBeChecked();
      }

      // Clearing leaves the scheduled hour behind, and that too persists.
      await page.getByRole('button', { name: 'Clear' }).click();
      await page.getByRole('button', { name: 'Save availability' }).click();
      await expect(page.getByText('Availability saved.')).toBeVisible();

      await page.reload();
      await expect(checkbox(page, 4)).toBeChecked();
      await expect(checkbox(page, 2)).not.toBeChecked();

      const { data: stored } = await admin
        .from('presenter_availability')
        .select('slot_start')
        .eq('user_id', presenter.userId);
      expect(stored?.map((row) => new Date(row.slot_start).toISOString())).toEqual([
        SLOT_4_UTC
      ]);
    } finally {
      await admin
        .from('presenter_availability')
        .delete()
        .eq('user_id', presenter.userId);
      await presenter.cleanup();
    }
  });
});

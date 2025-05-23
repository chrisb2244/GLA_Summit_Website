import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import { CAN_SUBMIT_PRESENTATION } from '@/app/configConstants';
import path from 'path';

test.describe('logged-in tests for presentation submission', () => {
  // Use an existing user who is not a presenter or organizer
  test.use({
    storageState: async ({}, use) =>
      use(path.resolve(__dirname, '.auth', 'attendee.json'))
  });

  test('/submit-presentation is accessible', async ({ page }) => {
    // This page should be accessible to all logged-in users
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

  test('Form fill testing', async ({ page }) => {
    await page.goto('/my-presentations');

    if (CAN_SUBMIT_PRESENTATION === false) {
      // Expect that the profile page instructs the user presentation submission is closed.
      await expect(
        page.getByText('The presentation submission process is closed.')
      ).toBeVisible();
      return;
    }

    const formPage = new PresentationSubmissionPage(page);
    await formPage.goto('/submit-presentation');
    // Wait for the login dialog to disappear (have saved session state)
    await formPage.waitForFormLoad();

    expect(await formPage.hasVisibleForm()).toBeTruthy();

    const testTitle = 'Test presentation title';
    await formPage.fillFormData({
      title: testTitle,
      learningPoints: 'Blah', // This is invalid input - too short
      presentationType: '15 minutes',
      isFinal: true
    });

    expect(await formPage.titleInput.inputValue()).toEqual(testTitle);
    expect(await formPage.isFinalInput.isChecked()).toEqual(true);

    await formPage.fillFormData({
      isFinal: false
    });

    expect(await formPage.isFinalInput.isChecked()).toEqual(false);
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

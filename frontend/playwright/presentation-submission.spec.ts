import { test, expect } from '@playwright/test';
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage';
import { CAN_SUBMIT_PRESENTATION } from '@/app/configConstants';
import path from 'path';
import { loginOnPage } from './utils';

test.describe('logged-out tests for presentation submission', () => {
  test('Form submission unavailable if logged out', async ({ page }) => {
    await page.goto('/submit-presentation');
    await expect(page.getByText('You need to be logged in')).toBeVisible();
  });

  test('Form loads correctly after logging in', async ({ page }) => {
    await page.goto('/submit-presentation');
    await expect(page.getByText('You need to be logged in')).toBeVisible();

    const email = process.env.TEST_ATTENDEE_EMAIL as string;
    await loginOnPage(page, email);

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

test.describe('logged-in tests for presentation submission', () => {
  test.skip(!CAN_SUBMIT_PRESENTATION, 'Presentation submission closed');

  // Use an existing user who is not a presenter or organizer
  const attendeeEmail = process.env.TEST_ATTENDEE_EMAIL as string;
  test.use({
    storageState: async ({}, use) =>
      use(path.resolve(__dirname, '.auth', 'attendee.json'))
  });

  test(
    '/submit-presentation is accessible',
    { tag: '@smoke' },
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

    // Wait for the login dialog to disappear (have saved session state)
    await formPage.waitForFormLoad();

    expect(await formPage.hasVisibleForm()).toBeTruthy();

    // Using the test attendee user, we expect
    const submitterEmailInput = page.locator('label:has-text("Email")');
    expect(await submitterEmailInput.isVisible()).toBeTruthy();
    expect(await submitterEmailInput.isEditable()).toBeFalsy();
    expect(await submitterEmailInput.inputValue()).toEqual(attendeeEmail);
  });

  test('Form fill testing', async ({ page }) => {
    // Skip if the presentation submission is closed
    // The message is checked in a different test
    await page.goto('/my-presentations');

    const formPage = new PresentationSubmissionPage(page);

    // Wait for the login dialog to disappear (have saved session state)
    await formPage.waitForFormLoad();

    expect(await formPage.hasVisibleForm()).toBeTruthy();

    const testTitle = 'Test presentation title' + Math.random();
    await formPage.fillFormData({
      title: testTitle,
      abstract: 'Blah blah '.repeat(20), // Need to exceed 100 chars
      learningPoints: 'Blah'.repeat(15), // Need to exceed 50 chars
      presentationType: '15 minutes',
      isFinal: true
    });

    await expect(formPage.titleInput).toHaveValue(testTitle);
    // expect(await formPage.isFinalInput.isChecked()).toEqual(true);

    await formPage.submitForm();

    // Should blank out on successful submission
    // Can't use the toBeEmpty here
    await expect(formPage.titleInput).toHaveValue('');

    const submittedPresentationsDiv = page.locator(
      'div:has-text("Submitted Presentations")'
    );
    const newSubmittedPresentation =
      submittedPresentationsDiv.getByLabel(testTitle);
    await expect(newSubmittedPresentation).toBeVisible();

    // Check it is marked as under consideration
    const statusDiv = newSubmittedPresentation.getByText('Under Consideration');
    await expect(statusDiv).toBeVisible();
  });

  test('Missing title cannot submit', async ({ page }) => {
    await page.goto('/submit-presentation');

    const formPage = new PresentationSubmissionPage(page);
    await formPage.waitForFormLoad();

    // Need to exceed 100 chars
    const abstract = 'Blah blah '.repeat(20);
    // Need to exceed 50 chars
    const learningPoints = 'Blah'.repeat(15);

    await formPage.fillFormData({
      abstract,
      learningPoints,
      presentationType: '15 minutes',
      isFinal: true
    });

    await formPage.submitForm();

    await expect(formPage.titleInput).toHaveAttribute('aria-invalid', 'true');

    // Check that the other elements are still filled
    await expect(formPage.abstractInput).toHaveValue(abstract);
    await expect(formPage.learningPointsInput).toHaveValue(learningPoints);
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

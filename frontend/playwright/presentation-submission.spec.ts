import { test, expect } from '@playwright/test'
import { PresentationSubmissionPage } from './models/PresentationSubmissionPage'

test.describe('logged-in tests for presentation submission', () => {
  test.skip()
  test.use({
    storageState: async ({}, use) =>
      use('./session-states/signedInNormalUserState.json')
  })

  test('Form fill testing', async ({ page }) => {
    const formPage = new PresentationSubmissionPage(page)
    await formPage.goto('/submit-presentation')
    // Wait for the login dialog to disappear (have saved session state)
    await formPage.waitForFormLoad()

    expect(await formPage.hasVisibleForm()).toBeTruthy()

    const testTitle = 'Test presentation title'
    await formPage.fillFormData({
      title: testTitle,
      learningPoints: 'Blah', // This is invalid input - too short
      presentationType: '15 minutes',
      isFinal: true
    })

    expect(await formPage.titleInput.inputValue()).toEqual(testTitle)
    expect(await formPage.isFinalInput.isChecked()).toEqual(true)

    await formPage.fillFormData({
      isFinal: false
    })

    expect(await formPage.isFinalInput.isChecked()).toEqual(false)
  })

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
})

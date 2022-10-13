import { test, expect } from '@playwright/test';
import { localIP, reqToBody as parseRequestBody } from './utils';
import http from 'http'
import { createAdminClient } from '@/lib/supabaseClient';
import { LoginablePage } from './models/LoginablePage';


const dummyServer = http.createServer()
test.beforeAll(() => {
  dummyServer.listen(3001)
})
test.afterAll(() => {
  dummyServer.close()
})

test('User can log-in', async ({page}) => {
  const port = 3001
  const path = 'testEndpoint'
  const requests: any[] = [];

  dummyServer.addListener('request', (req, res) => {
    console.log('Caught with dummyServer')
    parseRequestBody(req, (body) => {
      const jbody = JSON.parse(body)
      requests.push(jbody)
    })
    res.writeHead(200)
    return res.end()
  })

  await page.goto('/');

  const registerLoginButton = page.locator('role=button', {hasText: /sign in/i});
  await expect(registerLoginButton).toBeVisible();
  
  registerLoginButton.click();
  const dialog = page.locator('role=dialog');
  await expect(dialog).toBeVisible();

  // Should default to register
  const fnameBox = page.locator('[placeholder="First Name"]');
  const lnameBox = page.locator('[placeholder="Last Name"]');
  const emailBox = page.locator('[placeholder="Email"]');
  await expect(fnameBox).toBeVisible();

  const randomVal = Math.floor(Math.random()*10000).toString();
  const emailValue = `test${randomVal}_${localIP}_${port}_${path}_user@glasummit.org`
  await fnameBox.fill('Test_' + randomVal);
  await lnameBox.fill('User');
  await emailBox.fill(emailValue);

  const submitButton = page.locator('role=button', { hasText: "REGISTER" })
  await expect(submitButton).toBeVisible();

  await submitButton.click()
  await expect(page.locator('role=dialog', { hasText: /Thank you.*check.*email/i })).toBeVisible()
  // await page.waitForTimeout(3*1000);
  expect(requests).toHaveLength(2)
  const bodyPlain = requests[1]['text'] as string
  expect(bodyPlain).toBeDefined()
  expect(bodyPlain).toContain('supabase')

  const newUserData = requests[0]
  expect(newUserData['type']).toBe('signup')
  const userId = newUserData['userId']
  expect(userId).toBeDefined()

  console.log('Deleting user with id: ', userId)
  const adminClient = createAdminClient()
  const { data: uData, error } = await adminClient.auth.admin.deleteUser(userId)
  console.log({uData, error})
});

test('Enter key triggers correct behaviour for login form', async ({page}) => {
  const loginablePage = new LoginablePage(page)
  await loginablePage.goto('/')

  await loginablePage.openLoginOrRegisterForm('login')
  expect(await loginablePage.isLoginForm()).toBeTruthy()

  await loginablePage.fillInLoginForm('notavalidemail.com')
  // Attempt to submit by hitting enter
  await loginablePage.submitForm('enter key')
  // Should not be able to login (i.e. dialog remains open)
  expect(await loginablePage.hasOpenDialog()).toBeTruthy()
  const errors = await loginablePage.getAllErrors()
  expect(errors).toHaveLength(1)

})

test('Registration form displays errors correctly', async ({page}) => {
  const loginablePage = new LoginablePage(page)
  await loginablePage.goto('/')

  await loginablePage.openLoginOrRegisterForm('register')
  expect(await loginablePage.isRegistrationForm()).toBeTruthy()

  await loginablePage.fillInRegistrationForm({firstname: '', lastname: '', email: 'notavalidemail.com'})
  // Attempt to submit
  await loginablePage.submitForm('button click')
  // Should not be able to login (i.e. dialog remains open)
  expect(await loginablePage.hasOpenDialog()).toBeTruthy()
  const errors = await loginablePage.getAllErrors()
  expect(errors).toHaveLength(3)

})
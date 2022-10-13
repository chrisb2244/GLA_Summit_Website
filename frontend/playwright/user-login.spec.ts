import { test, expect } from '@playwright/test'
import { localIP, reqToBody as parseRequestBody } from './utils'
import http from 'http'
import { createAdminClient } from '@/lib/supabaseClient'
import { LoginablePage } from './models/LoginablePage'

const dummyServer = http.createServer()
test.beforeAll(() => {
  dummyServer.listen(3001)
})
test.afterAll(() => {
  dummyServer.close()
})

test('User can log-in', async ({ page }) => {
  const port = 3001
  const path = 'testEndpoint'
  const requests: any[] = []

  dummyServer.addListener('request', (req, res) => {
    console.log('Caught with dummyServer')
    parseRequestBody(req, (body) => {
      const jbody = JSON.parse(body)
      requests.push(jbody)
    })
    res.writeHead(200)
    return res.end()
  })

  const loginablePage = new LoginablePage(page)
  await loginablePage.goto('/')
  await loginablePage.openLoginOrRegisterForm('register')

  const randomVal = Math.floor(Math.random() * 10000).toString()
  const emailValue = `test${randomVal}_${localIP}_${port}_${path}_user@glasummit.org`
  await loginablePage.fillInRegistrationForm({
    firstname: 'Test_' + randomVal,
    lastname: 'User',
    email: emailValue
  })

  await loginablePage.submitForm() // defaults to button click

  await expect(
    page.locator('role=dialog', { hasText: /Thank you.*check.*email/i })
  ).toBeVisible()

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
  console.log({ uData, error })
})

test('Enter key triggers correct behaviour for login form', async ({
  page
}) => {
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

test('Registration form displays errors correctly', async ({ page }) => {
  const loginablePage = new LoginablePage(page)
  await loginablePage.goto('/')

  await loginablePage.openLoginOrRegisterForm('register')
  expect(await loginablePage.isRegistrationForm()).toBeTruthy()

  await loginablePage.fillInRegistrationForm({
    firstname: '',
    lastname: '',
    email: 'notavalidemail.com'
  })
  // Attempt to submit
  await loginablePage.submitForm('button click')
  // Should not be able to login (i.e. dialog remains open)
  expect(await loginablePage.hasOpenDialog()).toBeTruthy()
  const errors = await loginablePage.getAllErrors()
  expect(errors).toHaveLength(3)
})

test('Error state resets to empty when closing and reopening', async ({
  page
}) => {
  const loginablePage = new LoginablePage(page)
  await loginablePage.goto('/')

  await loginablePage.openLoginOrRegisterForm('register')
  // initially, no errors
  expect(await loginablePage.getAllErrors()).toHaveLength(0)

  await loginablePage.fillInRegistrationForm({
    firstname: '',
    lastname: '',
    email: 'notavalidemail.com'
  })

  await loginablePage.submitForm()
  const errors = await loginablePage.getAllErrors()
  expect(errors).toHaveLength(3)

  await loginablePage.closeDialogByClickingOutside()
  expect(await loginablePage.hasOpenDialog()).toBeFalsy()

  // repeat process, expect initial errors 0
  await loginablePage.openLoginOrRegisterForm('register')
  expect(await loginablePage.getAllErrors()).toHaveLength(0)
})

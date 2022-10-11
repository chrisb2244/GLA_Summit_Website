import { test, expect } from '@playwright/test';
import { localIP, reqToBody as parseRequestBody } from './utils';
import http from 'http'


const dummyServer = http.createServer()
test.beforeAll(() => {
  dummyServer.listen(3001)
})
test.afterAll(() => {
  dummyServer.close()
})

test('User can log-in', async ({page}) => {
  const testAddress = 'http://' + localIP + ':3001' + '/testEndpoint'
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
  await fnameBox.fill('Test_' + randomVal);
  await lnameBox.fill('User');
  await emailBox.fill(`test${randomVal}_${testAddress}_user@glasummit.org`);

  const submitButton = page.locator('role=button', { hasText: "REGISTER" })
  await expect(submitButton).toBeVisible();

  await submitButton.click()
  await expect(page.locator('role=dialog', { hasText: /Thank you.*check.*email/i })).toBeVisible()
  // await page.waitForTimeout(3*1000);
  expect(requests).toHaveLength(1)
  const bodyPlain = requests[0]['text'] as string
  expect(bodyPlain).toBeDefined()
  expect(bodyPlain).toContain('thisistheactionlink')
});
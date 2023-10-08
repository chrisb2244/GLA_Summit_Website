import { createAdminClient } from '@/lib/supabaseClient';
import { chromium, FullConfig, expect } from '@playwright/test';
import { LoginablePage } from './models/LoginablePage';
import { getMailsacEmailBody, checkMailsacEmail } from './utils';
// import { localIP, reqToBody as parseRequestBody } from './utils'

/* eslint-disable @typescript-eslint/no-explicit-any */

const shouldLog = true;
const log = (message?: any, ...params: any[]) => {
  if (shouldLog) {
    console.log(message, ...params);
  }
};

const deleteUser = async (id: string) => {
  log('Deleting user with id: ', id);
  const adminClient = createAdminClient();
  const { data: uData, error } = await adminClient.auth.admin.deleteUser(id);
  log({ uData, error });
};

async function globalSetup(config: FullConfig) {
  // Setup a server to catch login notifications from MSW mocks
  // const port = 3099;
  // const endpoint = 'loginEndpoint'
  // const requests: any[] = [];
  // const dummyServer = http.createServer();
  // dummyServer.listen(port);
  // dummyServer.addListener('request', (req, res) => {
  //   log('Caught with dummyServer for login')
  //   parseRequestBody(req, (body) => {
  //     const jbody = JSON.parse(body)
  //     requests.push(jbody)
  //   })
  //   res.writeHead(200)
  //   return res.end()
  // })
  // Setup a browser and login a new, non-organizer user
  // const browser = await chromium.launch()
  // const context = await browser.newContext()
  // const page = await context.newPage()
  // const loginablePage = new LoginablePage(page)
  // const baseUrl = config.projects[0].use.baseURL
  // log(baseUrl)
  // await loginablePage.goto(baseUrl + '/')
  // await loginablePage.openLoginOrRegisterForm('register')
  // // Create a random-email new user
  // const randomVal = Math.random().toString(36).substring(2)
  // // const emailValue = `test${randomVal}_${localIP}_${port}_${endpoint}_user@glasummit.org`;
  // const emailValue = `test-${randomVal}-glasummit@mailsac.com`
  // await loginablePage.fillInRegistrationForm({
  //   firstname: 'Test',
  //   lastname: 'User',
  //   email: emailValue
  // })
  // await loginablePage.submitForm()
  // await page
  //   .locator('role=dialog', { hasText: /Thank you.*check.*email/i })
  //   .waitFor({ state: 'visible' })
  // // expect(requests).toHaveLength(2);
  // // const userId = requests[0]['userId']
  // // const emailText = requests[1]['text'] as string
  // const emailText = await new Promise((resolve) => setTimeout(resolve, 1000))
  // .then(() => checkMailsacEmail(emailValue, 'GLA Summit 2022 Website Signup'))
  // .then((msg) => {
  //   if (msg === null) {
  //     throw new Error('Could not find message')
  //   }
  //   return getMailsacEmailBody(emailValue, msg._id)
  // })
  // console.log(emailText)
  // const activationLink = emailText.match(
  //   /Please use this link to confirm your email address: (.*)The non-HTML version/
  // )?.[1]
  // // if (typeof activationLink === 'undefined') {
  // //   deleteUser(userId)
  // //   throw new Error('Could not find activation link')
  // // }
  // // log('Activating via link: ', activationLink)
  // // console.log('UserId: ', userId)
  // // // Should redirect back to our site
  // // const authPage = await context.newPage();
  // // await authPage.goto(activationLink);
  // // await page.reload();
  // // await page.waitForLoadState('networkidle')
  // // log('URL now: ', page.url())
  // // const storageFileName = 'signedInNormalUserState.json';
  // // const storageStatePath = path.join('session-states', storageFileName);
  // // if (fs.existsSync(storageStatePath)) {
  // //   fs.unlinkSync(storageStatePath);
  // //   log(storageStatePath + ' was deleted');
  // // }
  // // await page.context().storageState({
  // //   path: storageStatePath
  // // })
  // // dummyServer.close();
  // await browser.close()
  // log('Finished globalSetup')
  // console.log('')
  // // The function returned by globalSetup is used for globalTeardown
  // return async () => {
  //   // console.log('Deleting userId: ', userId)
  //   // await deleteUser(userId)
  //   // console.log("")
  //   // fs.unlink(storageStatePath, (err) => {
  //   //   if (err) throw err
  //   //   log(storageStatePath + ' was deleted');
  //   // })
  // }
}

export default globalSetup;

/* eslint-enable @typescript-eslint/no-explicit-any */

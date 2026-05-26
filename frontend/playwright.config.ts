import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.join(__dirname, './.env.test');
const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
  throw envConfig.error;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './playwright',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  // fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:
      process.env.VERCEL_URL || process.env.baseURL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },

  // globalSetup: require.resolve('./playwright/global-setup.ts'),

  /* Configure projects for major browsers */
  projects: (() => {
    const authDir = path.join(__dirname, 'playwright/.auth');
    const authFiles = ['admin', 'organizer', 'presenter', 'attendee'].map((role) =>
      path.join(authDir, `${role}.json`)
    );
    const reuseAuth =
      process.env.PW_REUSE_AUTH === '1' &&
      authFiles.every((file) => fs.existsSync(file));

    const setupProject = {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] }
    };

    const deviceProjects = [
      { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      // Uncomment as required
      // { name: 'mobile chrome', use: { ...devices['Pixel 5'] } },
      // { name: 'mobile safari', use: { ...devices['iPhone 14'] } },
      // { name: 'chromium', use: { ...devices['Desktop Chromium'] } },
      // { name: 'webkit', use: { ...devices['Desktop Webkit'] } }
    ].map((device) => ({
      name: device.name,
      use: device.use,
      dependencies: reuseAuth ? [] : ['setup']
    }));


    return [
      ...(reuseAuth ? [] : [setupProject]),
      ...deviceProjects
    ];
  })(),

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

export default config;

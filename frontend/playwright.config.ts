import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
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
  // Tests now provision their own users via the userCreation factories, each
  // with a uniquely generated email. Because no two tests share a mailbox or
  // seeded row, there are no inbox-count or row races between them, so both
  // file-level and (where enabled) in-file parallelism are safe.
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI; also retry once locally to surface genuine flakes without hiding them */
  retries: process.env.CI ? 2 : 1,
  /* CI: serialise to avoid resource contention. Local: 6 (reduce maximum from undefined: CPU count / 2). */
  workers: process.env.CI ? 1 : 6,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:
      process.env.VERCEL_URL || process.env.baseURL || 'http://localhost:3000',

    /*
     * Vercel Firewall Attack Challenge Mode serves a "Vercel Security
     * Checkpoint" interstitial to automated/datacenter clients (e.g. CI), which
     * the browser can't pass. When SYNTHETIC_BYPASS_SECRET is set we attach the
     * matching header so a Vercel Firewall bypass rule (Header
     * `x-synthetic-bypass` equals the secret → Action: Bypass) lets the request
     * through. Only CI knows the secret, so the rule can't be abused.
     */
    ...(process.env.SYNTHETIC_BYPASS_SECRET && {
      extraHTTPHeaders: {
        'x-synthetic-bypass': process.env.SYNTHETIC_BYPASS_SECRET
      }
    }),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },

  // globalSetup: require.resolve('./playwright/global-setup.ts'),

  /* Configure projects for major browsers.
   *
   * There is no longer a shared `setup` project or saved storage state: each
   * test provisions and authenticates its own user (see playwright/utils). */
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
    // Uncomment as required
    // { name: 'mobile chrome', use: { ...devices['Pixel 5'] } },
    // { name: 'mobile safari', use: { ...devices['iPhone 14'] } },
    // { name: 'chromium', use: { ...devices['Desktop Chromium'] } },
    // { name: 'webkit', use: { ...devices['Desktop Webkit'] } }
  ]

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

export default config;

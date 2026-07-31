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
  /* Maximum time one test can run for. Higher on CI: parallel workers share
   * 4 vCPUs and a remote test DB, and OTP email waits can run up to 15s. */
  timeout: process.env.CI ? 45 * 1000 : 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000
  },
  // Tests are fully isolated (see below), so let workers pick up individual
  // tests rather than whole files — otherwise the largest spec file becomes
  // the critical path for the run.
  fullyParallel: true,
  // Tests now provision their own users via the userCreation factories, each
  // with a uniquely generated email. Because no two tests share a mailbox or
  // seeded row, there are no inbox-count or row races between them, so both
  // file-level and (where enabled) in-file parallelism are safe.
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI; also retry once locally to surface genuine flakes without hiding them */
  retries: process.env.CI ? 2 : 1,
  /* CI: 2 workers — ubuntu-latest has 4 vCPUs, which fits the Next server plus
   * ~3 browser instances. Local: 6 (reduce maximum from undefined: CPU count / 2).
   * Use a smaller number to reduce contention on the database, which appears to be
   * triggering a larger number of flaky tests. */
  workers: process.env.CI ? 2 : 6,
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
   * `setup` mints one logged-in storageState per shared role
   * (playwright/.auth/<role>.json) for read-only, identity-agnostic tests;
   * `auth-teardown` deletes those users and files after the run. Identity-
   * bound tests still provision their own user per test (see
   * playwright/utils). Filtered runs whose tests use no shared state (e.g.
   * --grep @synthetic) can pass --no-deps to skip the setup project entirely. */
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      teardown: 'auth-teardown',
      use: { ...devices['Desktop Chrome'] }
    },
    { name: 'auth-teardown', testMatch: /auth\.teardown\.ts/ },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    // Uncomment as required
    // { name: 'mobile chrome', use: { ...devices['Pixel 5'] } },
    // { name: 'mobile safari', use: { ...devices['iPhone 14'] } },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    }
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

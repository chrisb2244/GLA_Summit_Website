import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

// Self-contained production login smoke (no app/workspace imports — Checkly's
// runtime can't resolve them). It registers a new user, logs out, and logs back
// in, reading both OTPs from testmail.app. This validates the live Mailgun send
// path end to end (app → Mailgun → DNS/MX → testmail inbox → API read).
//
// ── Email address: coupling you must not break ──────────────────────────────
// The address is "{namespace}.checkly-{unique}@inbox.testmail.app".
//   • {namespace} is the real testmail namespace — REQUIRED as an env var so the
//     address resolves to your testmail account (testmail rejects other names).
//   • The "checkly-" tag prefix is a SENTINEL. The pg_cron purge in
//     supabase/migrations/20260627000000_purge_synthetic_test_users.sql deletes
//     exactly these addresses via the regex
//       ^[^@.]+\.checkly-[^@]+@inbox\.testmail\.app$
//     Keep that regex and this prefix in lockstep.
//   • It must NOT collide with the Playwright suite, whose addresses are
//     "{namespace}.test-{unique}@inbox.testmail.app" (generateTestEmail uses the
//     'test' prefix). Different tag prefix ⇒ the purge can never touch CI users.
const baseUrl = process.env.ENVIRONMENT_URL ?? 'https://glasummit.org';
const namespace = process.env.TESTMAIL_NAMESPACE;
const apiKey = process.env.TESTMAIL_API_KEY;
// Optional: matches the Vercel Firewall bypass rule used by the @synthetic specs
// so Checkly's datacenter IPs aren't served the Attack Challenge interstitial.
const bypassSecret = process.env.SYNTHETIC_BYPASS_SECRET;

// Production OTPs are 8 digits (6 locally); accept either, longer first.
const extractOtp = (body: string): string | null => {
  const specific = body.match(/(?:passcode|otp)[^\d]{0,20}(\d{8}|\d{6})/i);
  if (specific) return specific[1];
  const generic = body.match(/\b(\d{8}|\d{6})\b/);
  return generic ? generic[1] : null;
};

const TESTMAIL_QUERY = `
  query Inbox($namespace: String!, $tag: String!, $timestamp_from: Float) {
    inbox(namespace: $namespace, tag: $tag, timestamp_from: $timestamp_from) {
      result
      emails { subject html text timestamp }
    }
  }
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Forms render the submit button with a label that flips to a pending variant
// while in flight (e.g. "Register" → "Registering…"); match either and click.
const clickSubmit = (scope: Locator, label: RegExp) =>
  scope.getByRole('button').filter({ hasText: label }).first().click();

type TestmailResponse = {
  errors?: Array<{ message: string }>;
  data?: {
    inbox?: {
      result?: string;
      emails?: Array<{ html?: string; text?: string; timestamp: number }>;
    };
  };
};

// Poll testmail until an OTP to `tag` (sent at/after `sentAfter`, epoch ms) is
// readable. `sentAfter` MUST be captured before triggering the email so a slow
// Mailgun delivery isn't missed.
//
// Distinguishes a testmail problem (quota / rate-limit / auth) from a genuine
// login failure: any EXPLICIT API rejection throws a labeled "[testmail] …"
// error immediately instead of running out the clock and looking like a login
// regression. The one case this can't catch is a SILENT over-quota inbound drop
// — testmail returns success with an empty inbox, indistinguishable from "not
// arrived yet" — which still surfaces as the timeout at the end.
const waitForOtp = async (
  tag: string,
  sentAfter: number,
  timeoutMs = 60_000
): Promise<string> => {
  const deadline = Date.now() + timeoutMs;
  let lastTransientError: string | null = null;

  while (Date.now() < deadline) {
    const res = await fetch('https://api.testmail.app/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: TESTMAIL_QUERY,
        variables: { namespace, tag, timestamp_from: sentAfter }
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const detail = `HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`;
      // 429 (rate limit) and 5xx can be transient — keep polling, but remember
      // the cause so the timeout message names it. Other 4xx (auth / bad
      // request) won't self-heal: fail fast and labeled.
      if (res.status !== 429 && res.status < 500) {
        throw new Error(
          `[testmail] API rejected the request (${detail}) — a testmail problem, not a login failure`
        );
      }
      lastTransientError = detail;
      await sleep(3000);
      continue;
    }

    const json = (await res.json()) as TestmailResponse;

    if (json.errors && json.errors.length > 0) {
      const messages = json.errors.map((error) => error.message).join('; ');
      throw new Error(
        `[testmail] GraphQL error (${messages}) — a testmail problem, not a login failure`
      );
    }

    const inbox = json.data?.inbox;
    if (inbox?.result && inbox.result !== 'success') {
      throw new Error(
        `[testmail] inbox query returned result="${inbox.result}" — a testmail problem, not a login failure`
      );
    }

    const emails = (inbox?.emails ?? []).sort((a, b) => b.timestamp - a.timestamp);
    for (const email of emails) {
      const otp = extractOtp(`${email.text ?? ''}\n${email.html ?? ''}`);
      if (otp) return otp;
    }

    await sleep(3000);
  }

  const suffix = lastTransientError
    ? ` (last testmail API error: ${lastTransientError})`
    : '';
  throw new Error(
    `[testmail] no OTP for tag "${tag}" within ${timeoutMs}ms${suffix}`
  );
};

// ── Page helpers (inlined from playwright/models/LoginablePage.ts) ───────────
const openAuthForm = async (page: Page, type: 'login' | 'register') => {
  await page.getByRole('button', { name: /sign in/i }).first().click();
  await page.waitForURL(/\/auth\/(login|register)/);
  const loginForm = page.getByRole('form', { name: 'Login Form' });
  const registrationForm = page.getByRole('form', { name: 'Registration Form' });

  if (type === 'register') {
    if (!(await registrationForm.isVisible())) {
      // "Join Now" sits beside the login form, reachable via the shared wrapper.
      await loginForm.locator('..').getByRole('link', { name: /Join Now/i }).click();
    }
    await page.waitForURL(/\/auth\/register/);
  } else {
    if (!(await loginForm.isVisible())) {
      await registrationForm.locator('..').getByRole('link', { name: /Sign In/i }).click();
    }
    await page.waitForURL(/\/auth\/login/);
  }
};

const submitVerification = async (page: Page, code: string) => {
  await page.waitForURL(/\/auth\/validateLogin/);
  await page.getByRole('textbox', { name: 'Verification Code' }).fill(code);
  await clickSubmit(
    page.getByRole('form', { name: 'Verification Code form' }),
    /submit|submitting/i
  );
};

const expectLoggedInAs = async (page: Page, fullName: string) => {
  await expect(page.locator('role=button', { hasText: fullName })).toBeVisible({
    timeout: 15_000
  });
};

test('register, logout, then login via real OTP emails', async ({ page }) => {
  // Two OTP round-trips over real email; give the run generous headroom.
  test.setTimeout(180_000);

  if (!namespace || !apiKey) {
    throw new Error(
      'TESTMAIL_NAMESPACE and TESTMAIL_API_KEY must be set as Checkly env vars'
    );
  }

  if (bypassSecret) {
    await page.setExtraHTTPHeaders({ 'x-synthetic-bypass': bypassSecret });
  }

  const unique = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const tag = `checkly-${unique}`;
  const email = `${namespace}.${tag}@inbox.testmail.app`;
  const firstname = 'Checkly';
  const lastname = 'Monitor';
  const fullName = `${firstname} ${lastname}`;

  // ── 1. Register (first OTP) ────────────────────────────────────────────────
  const sentBeforeRegister = Date.now();
  await page.goto(baseUrl);
  await openAuthForm(page, 'register');

  const registrationForm = page.getByRole('form', { name: 'Registration Form' });
  await registrationForm.getByLabel('First Name').fill(firstname);
  await registrationForm.getByLabel('Last Name').fill(lastname);
  await registrationForm.getByLabel('Email').fill(email);
  await clickSubmit(registrationForm, /register|registering/i);

  const registerOtp = await waitForOtp(tag, sentBeforeRegister);
  await submitVerification(page, registerOtp);
  await expectLoggedInAs(page, fullName);

  // ── 2. Logout ──────────────────────────────────────────────────────────────
  await page.locator('role=button', { hasText: fullName }).click();
  await page.getByRole('button', { name: /logout/i }).click();
  await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible({
    timeout: 15_000
  });

  // ── 3. Login as the same user (second OTP) ─────────────────────────────────
  const sentBeforeLogin = Date.now();
  await openAuthForm(page, 'login');
  const loginForm = page.getByRole('form', { name: 'Login Form' });
  await loginForm.getByLabel('Email').fill(email);
  await clickSubmit(loginForm, /log ?in|logging ?in/i);

  const loginOtp = await waitForOtp(tag, sentBeforeLogin);
  await submitVerification(page, loginOtp);
  await expectLoggedInAs(page, fullName);
});

import { BrowserCheck, Frequency, RetryStrategyBuilder } from 'checkly/constructs';
import * as path from 'path';

// Daily register → logout → login smoke against production. Unlike the read-only
// @synthetic checks, this exercises the REAL email path: the live site mints a
// Supabase OTP and sends it via Mailgun to a testmail.app address, and the check
// reads the code back through testmail's API. It consumes two emails per run
// (one registration OTP, one login OTP) ≈ 60/month — within testmail's free 100.
//
// Each run registers a fresh production user; the daily pg_cron job in
// supabase/migrations/20260627000000_purge_synthetic_test_users.sql deletes them.
// The address sentinel ('.checkly-') MUST stay in sync with that migration's
// pattern (see login.spec.ts).
new BrowserCheck('login-otp-synthetic', {
  name: 'Production register/login OTP synthetic',
  activated: true,
  frequency: Frequency.EVERY_24H,
  // No retries: a failed run registers a fresh production user and sends real
  // Mailgun mail, so a Checkly retry would multiply prod-user churn and email
  // volume (worst during a testmail quota exhaustion or site outage — exactly
  // when retrying helps least). One run, one user, one alert.
  retryStrategy: RetryStrategyBuilder.noRetries(),
  code: {
    entrypoint: path.join(__dirname, 'login.spec.ts')
  }
});

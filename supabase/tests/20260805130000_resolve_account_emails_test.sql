-- pgTAP tests for 20260805130000_resolve_account_emails.sql
--
-- Assumes the migration under test has already been applied. The explicit
-- BEGIN/ROLLBACK is required (`supabase test db` does not wrap the file in a
-- transaction) and discards the alias seeded below.

BEGIN;
SELECT plan(12);

-- An account to attach an alias to, and a second one to prove isolation.
SELECT user_id AS acct_id, email AS acct_email
FROM public.account_emails WHERE is_primary ORDER BY email LIMIT 1 \gset
SELECT user_id AS other_id
FROM public.account_emails WHERE is_primary AND user_id <> :'acct_id'
 ORDER BY email LIMIT 1 \gset

SELECT set_config('test.acct_id',    :'acct_id',    true);
SELECT set_config('test.acct_email', :'acct_email', true);
SELECT set_config('test.other_id',   :'other_id',   true);

INSERT INTO public.account_emails (user_id, email, verified_at)
VALUES (current_setting('test.acct_id')::uuid, 'alias@test.email', now());
-- An address that was added but never proven.
INSERT INTO public.account_emails (user_id, email, verified_at)
VALUES (current_setting('test.acct_id')::uuid, 'unproven@test.email', NULL);

-- ---------------------------------------------------------------------------
-- The account-existence oracle is gone
-- ---------------------------------------------------------------------------
SELECT hasnt_function(
  'public', 'email_has_account', ARRAY['text'],
  'email_has_account no longer exists'
);

-- ---------------------------------------------------------------------------
-- resolve_account_email
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT user_id FROM public.resolve_account_email('alias@test.email')),
  current_setting('test.acct_id')::uuid,
  'an alias resolves to the account that holds it'
);
SELECT is(
  (SELECT primary_email FROM public.resolve_account_email('alias@test.email')),
  current_setting('test.acct_email'),
  'and yields the address GoTrue authenticates, not the one supplied'
);
SELECT is(
  (SELECT primary_email FROM public.resolve_account_email(
     upper(current_setting('test.acct_email')))),
  current_setting('test.acct_email'),
  'resolution is case-insensitive'
);
SELECT is(
  (SELECT count(*)::int FROM public.resolve_account_email('unproven@test.email')),
  0,
  'an unverified address does not resolve'
);
SELECT is(
  (SELECT count(*)::int FROM public.resolve_account_email('nobody@example.invalid')),
  0,
  'an unknown address does not resolve'
);

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------
SELECT is(
  has_function_privilege('anon', 'public.resolve_account_email(text)', 'EXECUTE'),
  false,
  'anon cannot resolve addresses to accounts'
);
SELECT is(
  has_function_privilege('authenticated', 'public.resolve_account_email(text)', 'EXECUTE'),
  false,
  'authenticated cannot resolve addresses to accounts either'
);
SELECT is(
  has_function_privilege('service_role', 'public.resolve_account_email(text)', 'EXECUTE'),
  true,
  'service_role can resolve addresses to accounts'
);

-- ---------------------------------------------------------------------------
-- Mentoring: recognised by an alias, not just the JWT address
-- ---------------------------------------------------------------------------
INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
VALUES ('alias@test.email', 'Alias', 'Holder', 'mentor');

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  current_setting('test.acct_id'),
    'role', 'authenticated',
    'email', current_setting('test.acct_email')
  )::text,
  true
);

SELECT is(
  (SELECT count(*)::int FROM public.mentoring WHERE email = 'alias@test.email'),
  1,
  'a user can read the mentoring row registered under their alias'
);
SELECT lives_ok(
  $$INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
    VALUES ('unproven@test.email', 'Alias', 'Holder', 'mentee')$$,
  'and can register another address of their own account'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',  current_setting('test.other_id'),
    'role', 'authenticated'
  )::text,
  true
);

SELECT is(
  (SELECT count(*)::int FROM public.mentoring WHERE email = 'alias@test.email'),
  0,
  'another account cannot read it'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;

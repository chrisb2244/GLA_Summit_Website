-- pgTAP tests for 20260601000000_fix_mentoring_policies_and_hygiene.sql
--
-- Assumes the migration under test has already been applied (the normal
-- `supabase test db` flow runs after `db:reset` applies all migrations).
--
-- The explicit BEGIN/ROLLBACK is required: `supabase test db` does NOT wrap the
-- file in a transaction, so without it the SET LOCAL ROLE and
-- set_config(..., is_local => true) calls below are no-ops ("SET LOCAL can only
-- be used in transaction blocks"). The rollback also discards the seeded row.

BEGIN;
SELECT plan(12);

-- A real account email/id to drive the auth.email() / account_emails paths.
SELECT user_id AS acct_id, email AS acct_email
FROM public.account_emails
 WHERE is_primary
ORDER BY email
LIMIT 1 \gset
SELECT set_config('test.acct_email', :'acct_email', true);
SELECT set_config('test.acct_id',    :'acct_id',    true);

-- Seed a mentoring row owned by nobody (different email) to prove that a
-- logged-in user cannot read other people's rows. Inserted as the superuser
-- test role, bypassing RLS.
INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
VALUES ('foreign@example.invalid', 'Not', 'You', 'mentor');

-- ---------------------------------------------------------------------------
-- email_has_account helper
--
-- Superseded: 20260805130000 withdrew the anon mentoring signup this helper
-- served, and dropped the helper with it. Asserted here so this file describes
-- the schema as it now stands rather than as it stood in June.
-- ---------------------------------------------------------------------------
SELECT hasnt_function(
  'public', 'email_has_account', ARRAY['text'],
  'email_has_account has been dropped'
);

-- ---------------------------------------------------------------------------
-- mentoring policy set was replaced (old buggy policy is gone)
-- ---------------------------------------------------------------------------
SELECT policies_are(
  'public', 'mentoring',
  ARRAY[
    'Logged in users can register their own email',
    'Users can read their own status'
  ],
  'mentoring has exactly the two policies left after 20260805130000'
);

-- ---------------------------------------------------------------------------
-- anon INSERT behaviour
-- ---------------------------------------------------------------------------
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '', true);

-- Registering used to be open to anon, gated on whether the address already
-- had an account — which is what made it an oracle. Now it is closed outright,
-- so no answer about any address leaks either way.
SELECT throws_ok(
  $$INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
    VALUES ('brand-new@example.invalid', 'New', 'Person', 'mentee')$$,
  '42501',
  NULL,
  'anon cannot register an address with no account'
);
SELECT throws_ok(
  $$INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
    VALUES (current_setting('test.acct_email'), 'Imp', 'Oster', 'mentee')$$,
  '42501',
  NULL,
  'anon cannot register an address that has one either — same error, no signal'
);
SELECT is(
  has_table_privilege('anon', 'public.mentoring', 'INSERT'),
  false,
  'and the INSERT privilege itself is withdrawn from anon'
);
RESET ROLE;

-- ---------------------------------------------------------------------------
-- authenticated INSERT / SELECT behaviour (JWT email = own account email)
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',   current_setting('test.acct_id'),
    'email', current_setting('test.acct_email'),
    'role',  'authenticated'
  )::text,
  true
);

SELECT lives_ok(
  $$INSERT INTO public.mentoring (email, firstname, lastname, entry_type)
    VALUES (current_setting('test.acct_email'), 'Me', 'Self', 'mentor')$$,
  'authenticated CAN register their own account email'
);
SELECT is(
  (SELECT count(*)::int FROM public.mentoring
   WHERE email = current_setting('test.acct_email')),
  1,
  'authenticated can read their own mentoring row'
);
SELECT is(
  (SELECT count(*)::int FROM public.mentoring
   WHERE email = 'foreign@example.invalid'),
  0,
  'authenticated cannot read another person''s mentoring row'
);
RESET ROLE;

-- ---------------------------------------------------------------------------
-- confirmed_presentations.created_at column protection restored
-- ---------------------------------------------------------------------------
SELECT is(
  has_column_privilege('authenticated', 'public.confirmed_presentations', 'created_at', 'SELECT'),
  false,
  'authenticated cannot SELECT confirmed_presentations.created_at'
);
SELECT is(
  has_column_privilege('authenticated', 'public.confirmed_presentations', 'id', 'SELECT'),
  true,
  'authenticated can still SELECT confirmed_presentations.id'
);

-- ---------------------------------------------------------------------------
-- ticket sequence USAGE withdrawn from client roles
-- ---------------------------------------------------------------------------
SELECT is(
  has_sequence_privilege('authenticated', 'public.ticket_sequence_2026', 'USAGE'),
  false,
  'authenticated has no USAGE on ticket_sequence_2026'
);
SELECT is(
  has_sequence_privilege('anon', 'public.ticket_sequence_2026', 'USAGE'),
  false,
  'anon has no USAGE on ticket_sequence_2026'
);

-- (The 3b check_confirmer_is_submitter search_path assertion was removed: the
-- security-advisor hygiene migration dropped that function in favour of an
-- RLS WITH CHECK on confirmed_presentations.)

SELECT * FROM finish();
ROLLBACK;

-- pgTAP tests for 20260805120000_add_account_emails.sql
--
-- The explicit BEGIN/ROLLBACK is required: `supabase test db` does NOT wrap the
-- file in a transaction. The rollback also discards the auth.users rows the
-- trigger tests create.

BEGIN;
SELECT plan(26);

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
SELECT has_table('public', 'account_emails', 'account_emails exists');
SELECT hasnt_view('public', 'email_lookup', 'no compatibility view is left behind');
SELECT hasnt_table('public', 'email_lookup', 'and the table it replaced is gone');
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.account_emails'::regclass),
  true,
  'RLS is enabled on account_emails'
);
-- The readers that moved are string function bodies, so PostgreSQL records no
-- dependency on what they read: this tests that no function strings reference
-- email_lookup.
SELECT is(
  (SELECT count(*)::int
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosrc LIKE '%email_lookup%'),
  0,
  'no function body still reads email_lookup'
);

-- ---------------------------------------------------------------------------
-- Privileges. The migration REVOKEs before granting because a table inherits
-- whatever ALTER DEFAULT PRIVILEGES says: production currently hands anon and
-- authenticated TRUNCATE/REFERENCES/TRIGGER/MAINTAIN on every new table in
-- public, and TRUNCATE ignores RLS. anon must end up with nothing at all.
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT bool_or(has_table_privilege('anon', 'public.account_emails', p))
     FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p),
  false,
  'anon holds no privilege of any kind on account_emails'
);
SELECT is(
  (SELECT bool_or(has_table_privilege('authenticated', 'public.account_emails', p))
     FROM unnest(ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p),
  false,
  'authenticated can only read account_emails'
);
SELECT is(
  has_table_privilege('authenticated', 'public.account_emails', 'SELECT'),
  true,
  'authenticated can read account_emails (RLS restricts which rows)'
);

-- ---------------------------------------------------------------------------
-- Backfill: every live account has exactly one primary address
-- ---------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int
     FROM auth.users u
     JOIN public.profiles p ON p.id = u.id
    WHERE u.email IS NOT NULL AND u.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.account_emails ae
         WHERE ae.user_id = u.id AND ae.is_primary
      )),
  0,
  'every auth.users account was backfilled with a primary address'
);
SELECT is(
  (SELECT count(*)::int FROM public.account_emails ae
     JOIN auth.users u ON u.id = ae.user_id
    WHERE ae.is_primary AND ae.email <> lower(u.email)),
  0,
  'each primary address matches the address GoTrue holds'
);

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------
SELECT user_id AS acct_id FROM public.account_emails
 WHERE is_primary ORDER BY email LIMIT 1 \gset
SELECT set_config('test.acct_id', :'acct_id', true);

SELECT throws_ok(
  format(
    $$INSERT INTO public.account_emails (user_id, email, verified_at)
      VALUES (%L, 'MixedCase@test.email', now())$$,
    current_setting('test.acct_id')
  ),
  '23514',
  NULL,
  'an address that is not lowercased is rejected'
);

SELECT throws_ok(
  format(
    $$INSERT INTO public.account_emails (user_id, email, is_primary)
      VALUES (%L, 'unverified-primary@test.email', true)$$,
    current_setting('test.acct_id')
  ),
  '23514',
  NULL,
  'an unverified address cannot be primary'
);

SELECT throws_ok(
  format(
    $$INSERT INTO public.account_emails (user_id, email, is_primary, verified_at)
      VALUES (%L, 'second-primary@test.email', true, now())$$,
    current_setting('test.acct_id')
  ),
  '23505',
  NULL,
  'an account cannot have two primary addresses'
);

SELECT throws_ok(
  format(
    $$INSERT INTO public.account_emails (user_id, email, verified_at)
      SELECT %L, email, now() FROM public.account_emails
       WHERE is_primary AND user_id <> %L LIMIT 1$$,
    current_setting('test.acct_id'),
    current_setting('test.acct_id')
  ),
  '23505',
  NULL,
  'an address already held by another account is rejected'
);

-- A verified alias on the same account is fine.
INSERT INTO public.account_emails (user_id, email, verified_at)
VALUES (current_setting('test.acct_id')::uuid, 'alias@test.email', now());
SELECT is(
  (SELECT count(*)::int FROM public.account_emails
    WHERE user_id = current_setting('test.acct_id')::uuid),
  2,
  'an account can hold a second, non-primary address'
);
SELECT is(
  (SELECT count(*)::int FROM public.account_emails
    WHERE user_id = current_setting('test.acct_id')::uuid AND is_primary),
  1,
  'and adding it leaves the account with exactly one primary'
);

-- ---------------------------------------------------------------------------
-- Exactly one primary. The partial unique index covers "at most one"; these
-- cover "at least one", which is deferred to commit so that reassigning the
-- primary can be two statements.
-- ---------------------------------------------------------------------------
-- The check is deferred, so it is SET CONSTRAINTS ... IMMEDIATE that stands in
-- for the commit each of these would otherwise need. throws_ok runs its
-- statement in a subtransaction, so a rejection also undoes the delete.

-- Deleting the primary while other addresses remain is refused.
SAVEPOINT before_delete;
DELETE FROM public.account_emails
  WHERE user_id = current_setting('test.acct_id')::uuid AND is_primary;
SELECT throws_ok(
  'SET CONSTRAINTS ALL IMMEDIATE',
  '23514',
  NULL,
  'an account cannot be left with addresses but no primary'
);
ROLLBACK TO SAVEPOINT before_delete;

-- Demote-then-promote, the shape the auth.users trigger uses, is legal: the
-- account is briefly without a primary between the two statements.
SAVEPOINT before_swap;
UPDATE public.account_emails SET is_primary = false
  WHERE user_id = current_setting('test.acct_id')::uuid AND is_primary;
UPDATE public.account_emails SET is_primary = true
  WHERE user_id = current_setting('test.acct_id')::uuid
    AND email = 'alias@test.email';
SELECT lives_ok(
  'SET CONSTRAINTS ALL IMMEDIATE',
  'moving the primary between two addresses is allowed'
);
SELECT is(
  (SELECT email FROM public.account_emails
    WHERE user_id = current_setting('test.acct_id')::uuid AND is_primary),
  'alias@test.email',
  'and leaves the account with the new primary'
);
ROLLBACK TO SAVEPOINT before_swap;
SET CONSTRAINTS ALL DEFERRED;

-- Removing every address is allowed: that is an account being torn down.
SAVEPOINT before_clear;
DELETE FROM public.account_emails
  WHERE user_id = current_setting('test.acct_id')::uuid;
SELECT lives_ok(
  'SET CONSTRAINTS ALL IMMEDIATE',
  'an account may hold no addresses at all'
);
ROLLBACK TO SAVEPOINT before_clear;
SET CONSTRAINTS ALL DEFERRED;

-- ---------------------------------------------------------------------------
-- Triggers: a new account, and an address change
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000000aa',
  'authenticated', 'authenticated',
  'Trigger.Test@test.email', 'x',
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"firstname": "Trigger", "lastname": "Test"}'
);

SELECT is(
  (SELECT email FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa' AND is_primary),
  'trigger.test@test.email',
  'a new account gets its address recorded, normalised, as the primary'
);

UPDATE auth.users
  SET email = 'Trigger.Moved@test.email'
  WHERE id = '00000000-0000-0000-0000-0000000000aa';

SELECT is(
  (SELECT email FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa' AND is_primary),
  'trigger.moved@test.email',
  'changing the address moves the primary flag to the new one'
);
SELECT is(
  (SELECT verified_at IS NOT NULL FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa'
      AND email = 'trigger.test@test.email'),
  true,
  'the previous address is kept as a verified alias'
);
SELECT is(
  (SELECT count(*)::int FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa' AND is_primary),
  1,
  'and the account still has exactly one primary afterwards'
);

-- Moving back to an address the account already holds must not duplicate it.
UPDATE auth.users
  SET email = 'trigger.test@test.email'
  WHERE id = '00000000-0000-0000-0000-0000000000aa';

SELECT is(
  (SELECT count(*)::int FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa'),
  2,
  'changing back to a held address reuses the existing row'
);
SELECT is(
  (SELECT email FROM public.account_emails
    WHERE user_id = '00000000-0000-0000-0000-0000000000aa' AND is_primary),
  'trigger.test@test.email',
  'and makes it primary again'
);

SELECT * FROM finish();
ROLLBACK;

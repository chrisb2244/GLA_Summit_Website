-- pgTAP tests for the GRANT/REVOKE surface of the objects introduced or hardened
-- on the organizer-voting / force-conclusion branch. Run with: npx supabase test db
--
-- These assert the *privilege* layer (not RLS): who is allowed to EXECUTE the
-- functions and hold table privileges. They exist because Supabase's default
-- privileges silently GRANT new public objects to anon/authenticated/service_role
-- as named roles, so "restricted" access requires explicit REVOKEs -- a bare
-- REVOKE ... FROM PUBLIC does not remove those named-role grants. See the header
-- comments in 20260608120100 / 20260702000000 / 20260702000100.
--
-- Scope: only objects on this branch whose migrations imply restricted access via
-- an explicit REVOKE or a comment. Other tables/functions are intentionally left
-- for a future, separate access-control test pass.

BEGIN;
SELECT plan(17);

-- ---------------------------------------------------------------------------
-- Functions. apply_submission_outcome performs an unconditional outcome write and
-- evaluate_* are rule-bound / trigger-only: none may be called by application
-- roles. Their SECURITY DEFINER callers run as the owner regardless.
-- ---------------------------------------------------------------------------
SELECT function_privs_are(
  'public', 'apply_submission_outcome', ARRAY['uuid', 'text']::name[],
  'anon', '{}'::name[],
  'apply_submission_outcome: anon has no EXECUTE');
SELECT function_privs_are(
  'public', 'apply_submission_outcome', ARRAY['uuid', 'text']::name[],
  'authenticated', '{}'::name[],
  'apply_submission_outcome: authenticated has no EXECUTE');

SELECT function_privs_are(
  'public', 'evaluate_submission', ARRAY['uuid']::name[],
  'anon', '{}'::name[],
  'evaluate_submission: anon has no EXECUTE');
SELECT function_privs_are(
  'public', 'evaluate_submission', ARRAY['uuid']::name[],
  'authenticated', '{}'::name[],
  'evaluate_submission: authenticated has no EXECUTE');

SELECT function_privs_are(
  'public', 'evaluate_submission_votes', '{}'::name[],
  'anon', '{}'::name[],
  'evaluate_submission_votes (trigger fn): anon has no EXECUTE');
SELECT function_privs_are(
  'public', 'evaluate_submission_votes', '{}'::name[],
  'authenticated', '{}'::name[],
  'evaluate_submission_votes (trigger fn): authenticated has no EXECUTE');

SELECT function_privs_are(
  'public', 'evaluate_under_review_submissions', '{}'::name[],
  'anon', '{}'::name[],
  'evaluate_under_review_submissions (trigger fn): anon has no EXECUTE');
SELECT function_privs_are(
  'public', 'evaluate_under_review_submissions', '{}'::name[],
  'authenticated', '{}'::name[],
  'evaluate_under_review_submissions (trigger fn): authenticated has no EXECUTE');

-- force_submission_outcome self-authorizes against the concluders allow-list, so it
-- IS callable by authenticated (the app's organizer session) but by nobody else.
SELECT function_privs_are(
  'public', 'force_submission_outcome', ARRAY['uuid', 'text']::name[],
  'authenticated', ARRAY['EXECUTE']::name[],
  'force_submission_outcome: authenticated may EXECUTE');
SELECT function_privs_are(
  'public', 'force_submission_outcome', ARRAY['uuid', 'text']::name[],
  'anon', '{}'::name[],
  'force_submission_outcome: anon has no EXECUTE');

-- ---------------------------------------------------------------------------
-- Tables.
-- ---------------------------------------------------------------------------
-- submission_votes: the migration states "anon has no access" (RLS aside). Assert
-- the restrictive claim at the grant level; authenticated's write surface is left
-- to RLS and not pinned here.
SELECT table_privs_are(
  'public', 'submission_votes', 'anon', '{}'::name[],
  'submission_votes: anon has no table privileges');

-- submission_concluders / forced_conclusions: owner-managed. Every application role
-- is locked to SELECT-only (authenticated, for the UI gate / audit read) with no
-- writes anywhere -- notably service_role, which bypasses RLS and so must be denied
-- at the grant level.
SELECT table_privs_are(
  'public', 'submission_concluders', 'anon', '{}'::name[],
  'submission_concluders: anon has no table privileges');
SELECT table_privs_are(
  'public', 'submission_concluders', 'authenticated', ARRAY['SELECT']::name[],
  'submission_concluders: authenticated has SELECT only');
SELECT table_privs_are(
  'public', 'submission_concluders', 'service_role', '{}'::name[],
  'submission_concluders: service_role has no table privileges (write-locked)');

SELECT table_privs_are(
  'public', 'forced_conclusions', 'anon', '{}'::name[],
  'forced_conclusions: anon has no table privileges');
SELECT table_privs_are(
  'public', 'forced_conclusions', 'authenticated', ARRAY['SELECT']::name[],
  'forced_conclusions: authenticated has SELECT only');
SELECT table_privs_are(
  'public', 'forced_conclusions', 'service_role', '{}'::name[],
  'forced_conclusions: service_role has no table privileges (write-locked)');

SELECT * FROM finish();
ROLLBACK;

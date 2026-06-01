-- Fixes and hardening for issues found in a migration review (2026-06-01).
--
-- 1. mentoring RLS policies referenced a non-existent profiles.email column.
-- 2. confirmed_presentations.created_at column protection was reverted by a
--    later blanket GRANT SELECT.
-- 3. Hygiene: over-broad sequence USAGE grants, and a trigger function missing
--    SET search_path.


-- =============================================================================
-- 1. Fix the mentoring RLS policies
-- =============================================================================
-- The original policies (20251104021443_add_mentoring.sql) all contained the
-- subquery `SELECT mentoring.email FROM public.profiles`. The profiles table
-- has no email column (it held emails in an older schema, but never in this
-- database), so `mentoring.email` bound as a correlated reference to the row
-- being inserted/read. The subquery therefore echoed the row's own email back,
-- making the conditions tautological and producing three faults:
--   * SELECT: any authenticated user could read the entire mentoring table.
--   * authenticated INSERT: accepted any email/name, not just the caller's.
--   * anon INSERT: blocked entirely whenever profiles was non-empty, breaking
--     the unauthenticated signup the anon INSERT grant was meant to enable.
--
-- Emails live in email_lookup, which is RLS-locked to organizers. A policy
-- subquery against it would run as the calling (anon/authenticated) role and
-- see zero rows, so the "is this email already an account?" test is delegated
-- to a SECURITY DEFINER helper that runs as the table owner and bypasses RLS.
-- The caller's own email is taken from the JWT via auth.email(), avoiding any
-- table access.

CREATE OR REPLACE FUNCTION public.email_has_account(p_email text)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.email_lookup el WHERE el.email = p_email
    );
  $$;

-- Execute must be granted to the roles that evaluate the policy below.
-- NOTE: this exposes an account-existence oracle to anon. That capability
-- already exists implicitly (an anon INSERT either succeeds or fails depending
-- on whether the email has an account), so the helper does not widen exposure
-- beyond the original design intent.
REVOKE ALL ON FUNCTION public.email_has_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can register if email not in profiles" ON public.mentoring;
DROP POLICY IF EXISTS "Logged in users can register their own email" ON public.mentoring;
DROP POLICY IF EXISTS "Users can read their own status" ON public.mentoring;

-- Unauthenticated (or authenticated) signup for an email that has no account.
CREATE POLICY "Register an email with no existing account"
  ON public.mentoring
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (NOT public.email_has_account(email));

-- A logged-in user may always register the email tied to their own account,
-- even though that email does have an account.
CREATE POLICY "Logged in users can register their own email"
  ON public.mentoring
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT auth.email()));

-- A logged-in user can read the mentoring row for their own account email.
CREATE POLICY "Users can read their own status"
  ON public.mentoring
  FOR SELECT
  TO authenticated
  USING (email = (SELECT auth.email()));


-- =============================================================================
-- 2. Re-protect confirmed_presentations.created_at
-- =============================================================================
-- 20251105065029 revoked column-level SELECT on created_at so the confirmation
-- timestamp (private) stays hidden while the id list (public) remains readable.
-- The later table-level GRANT SELECT in 20260522000000 re-granted every column,
-- silently undoing that -- and a column-level REVOKE cannot claw it back, because
-- has_column_privilege treats a table-level SELECT as covering every column.
-- The only way to expose some columns but not others is to drop the table-level
-- SELECT entirely and grant SELECT per allowed column. confirmed_presentations
-- has just (id, created_at); keep id readable, leave created_at withheld.
-- INSERT/UPDATE/DELETE for authenticated and all of service_role are untouched.
REVOKE SELECT ON TABLE public.confirmed_presentations FROM authenticated;
GRANT SELECT (id) ON TABLE public.confirmed_presentations TO authenticated;


-- =============================================================================
-- 3a. Withdraw direct sequence access from anon/authenticated
-- =============================================================================
-- 20260522000000 ran `GRANT USAGE ON ALL SEQUENCES ... TO authenticated, anon`,
-- and create_ticket_sequence() additionally granted USAGE on each new ticket
-- sequence to those roles. That let any client call nextval() on a ticket
-- sequence directly and burn ticket numbers. Ticket numbers are now assigned
-- exclusively by SECURITY DEFINER routines (calculate_ticket_number trigger and
-- get_or_create_ticket), which run as the sequence owner, so callers need no
-- direct sequence access. No public-schema sequence backs an INSERT default
-- reachable by these roles, so revoking is safe.
REVOKE USAGE ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Stop create_ticket_sequence() from re-granting on each new sequence.
-- (Only this GRANT line changes; the rest matches 20260527100000.)
CREATE OR REPLACE FUNCTION public.create_ticket_sequence()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
  AS $$
  BEGIN
    IF NEW.name IS NULL THEN
      NEW.name := 'public.ticket_sequence_' || NEW.year::text;
    END IF;
    -- String concatenation rather than format('%I'): NEW.name may be a
    -- schema-qualified identifier that %I would mis-quote as one token. The
    -- value is enum-derived or set by a trusted service_role caller (no INSERT
    -- grant on ticket_sequences exists for anon/authenticated).
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || NEW.name;
    -- No GRANT to anon/authenticated: number assignment runs as the sequence
    -- owner via SECURITY DEFINER routines, so clients need no direct access.
    RETURN NEW;
  END
  $$;


-- =============================================================================
-- 3b. Pin search_path on check_confirmer_is_submitter()
-- =============================================================================
-- The original (20251105065029) had no SET search_path (Supabase linter
-- function_search_path_mutable). It stays SECURITY INVOKER -- it relies on RLS
-- letting the submitter read their own submission row -- but all references are
-- now schema-qualified so it is unaffected by the caller's session search_path.
CREATE OR REPLACE FUNCTION public.check_confirmer_is_submitter()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
  AS $$
    BEGIN
      IF ((SELECT submitter_id FROM public.presentation_submissions WHERE id = NEW.id) = (SELECT auth.uid())) THEN
        RETURN NEW;
      ELSE
        RETURN NULL;
      END IF;
    END;
  $$;

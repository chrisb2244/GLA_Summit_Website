-- Resolving an address to the account that owns it.
--
-- With more than one address per account, two things that previously meant "the
-- account's address" have to be restated over the whole set:
--
--   * the mentoring RLS  – its policies compare against auth.email(), which is
--                          always the primary. A user signed in via an alias
--                          could not read or write their own row.
--   * sign-in            – needs the account (and the address GoTrue knows) for
--                          any address the account holds. That is
--                          resolve_account_email.
--
-- A third, email_has_account, is removed rather than restated. See section 3.


-- =============================================================================
-- 1. The calling user's own addresses
-- =============================================================================
-- For policies that need "an address belonging to me" rather than "the address
-- in my JWT". SECURITY DEFINER to read past account_emails' RLS; it discloses
-- nothing the caller cannot already read about themselves.
CREATE OR REPLACE FUNCTION public.current_user_emails()
  RETURNS SETOF text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    SELECT ae.email
    FROM public.account_emails ae
    WHERE ae.user_id = (SELECT auth.uid());
  $$;

REVOKE ALL ON FUNCTION public.current_user_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_emails() TO authenticated, service_role;


-- =============================================================================
-- 2. Sign-in resolution
-- =============================================================================
-- Given any address the account holds, return the account and the address
-- GoTrue authenticates. The app mints the OTP against primary_email and mails
-- it to whichever address the visitor typed.
--
-- Only verified addresses resolve: an unverified address must never be a way
-- in.
--
-- service_role only. This maps an address to an account and would be an
-- enumeration oracle in anon's hands.
CREATE OR REPLACE FUNCTION public.resolve_account_email(p_email text)
  RETURNS TABLE (user_id uuid, primary_email text)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    SELECT ae.user_id, pri.email
    FROM public.account_emails ae
    JOIN public.account_emails pri
      ON pri.user_id = ae.user_id AND pri.is_primary
    WHERE ae.email = lower(p_email)
      AND ae.verified_at IS NOT NULL;
  $$;

REVOKE ALL ON FUNCTION public.resolve_account_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_account_email(text) TO service_role;


-- =============================================================================
-- 3. Mentoring: registration requires a session, and names the caller
-- =============================================================================
-- The unauthenticated signup path is withdrawn.
--
-- It could not identify who was registering, so it asked email_has_account
-- whether the address already belonged to someone — which made that function,
-- and the insert itself, an account-existence oracle.
-- Requiring a session removes the question instead of answering it: the policy
-- compares the address against the caller's own addresses, which discloses nothing.
DROP POLICY IF EXISTS "Register an email with no existing account" ON public.mentoring;
DROP POLICY IF EXISTS "Logged in users can register their own email" ON public.mentoring;
DROP POLICY IF EXISTS "Users can read their own status" ON public.mentoring;

CREATE POLICY "Logged in users can register their own email"
  ON public.mentoring
  FOR INSERT
  TO authenticated
  WITH CHECK (email IN (SELECT public.current_user_emails()));

CREATE POLICY "Users can read their own status"
  ON public.mentoring
  FOR SELECT
  TO authenticated
  USING (email IN (SELECT public.current_user_emails()));

-- Granted by 20260522000000 for the signup that no longer exists.
REVOKE INSERT ON public.mentoring FROM anon;

-- Nothing calls email_has_account now: drop the unused function to reduce
-- area to secure.
DROP FUNCTION IF EXISTS public.email_has_account(text);

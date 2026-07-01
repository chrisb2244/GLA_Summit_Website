-- Allow-list of users permitted to force an early accept/decline on a submission
-- from the review page, bypassing the organizer-vote tally.
-- Mirrors log_viewers: a single-column membership table that gates a privileged action.
--
-- Membership is administered ONLY out-of-band by a database admin (the
-- `postgres`/owner role): authenticated may SELECT (to check the current user's own
-- membership for the UI gate), but all write privileges are revoked from every
-- application role -- including service_role -- so the application cannot add or
-- remove concluders.
--
-- NB: this write-lock has to be an explicit REVOKE. Supabase's default privileges
-- GRANT full DML on new public tables to anon/authenticated/service_role, and
-- service_role additionally has BYPASSRLS, so RLS alone would NOT stop the admin
-- (service_role) client from writing -- only revoking the table privilege does.
-- Seeding still works because db:reset/seed runs as the owner, which is not subject
-- to these grants.
CREATE TABLE IF NOT EXISTS public.submission_concluders (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id)
);
ALTER TABLE public.submission_concluders ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read only their own membership row (fail-fast UI gate).
-- The force RPC additionally re-checks membership server-side (SECURITY DEFINER),
-- so this SELECT policy is purely for the "show/hide the button" decision.
CREATE POLICY "Select yourself"
  ON public.submission_concluders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Lock the table to the owner: revoke every default-privilege grant Supabase gives
-- the application roles (not just DML -- also TRUNCATE), then re-grant only the
-- SELECT the UI gate needs. RLS still narrows that SELECT to the caller's own row.
REVOKE ALL ON public.submission_concluders
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.submission_concluders TO authenticated;

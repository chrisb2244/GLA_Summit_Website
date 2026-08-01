-- Allow-list of users permitted to use the admin presenter-creation panel
-- (/admin/create-presenter): create a brand-new presenter account and submit a
-- presentation on that presenter's behalf.
--
-- Mirrors log_viewers: a single-column membership table gating a privileged page.
-- Unlike submission_concluders, the application (service_role) keeps write access
-- so memberships can be seeded/administered from the admin client and by the e2e
-- test factories, exactly as log_viewers works today.
CREATE TABLE IF NOT EXISTS public.presenter_admins (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id)
);
ALTER TABLE public.presenter_admins ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read only their own membership row. The page gate and
-- the server action both re-check membership through this policy, so a
-- non-member's SELECT simply returns no rows and access fails closed.
CREATE POLICY "Select yourself"
  ON public.presenter_admins
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Supabase's default privileges grant full DML on new public tables to
-- anon/authenticated/service_role. Narrow that explicitly rather than relying on
-- the defaults: anon gets nothing, authenticated may only SELECT (RLS then
-- narrows it to their own row), and service_role keeps DML for administration.
REVOKE ALL ON public.presenter_admins
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.presenter_admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presenter_admins TO service_role;

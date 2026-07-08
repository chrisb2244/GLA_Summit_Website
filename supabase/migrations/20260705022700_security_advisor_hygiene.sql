-- Security-advisor hygiene (2026-06-04).
--
-- Clears three classes of Supabase security-advisor warnings without changing
-- any intended behaviour:
--   1. rls_policy_always_true on confirmed_presentations (INSERT WITH CHECK true).
--   2. SECURITY DEFINER trigger functions left EXECUTE-able by anon/authenticated.
--   3. public_bucket_allows_listing on the avatars bucket.
--
-- Out of scope (intentionally not touched here):
--   * SECURITY DEFINER *data* RPCs (get_my_submissions, get_or_create_ticket,
--     get_editable_submission_emails): they must be callable and self-authorize
--     via auth.uid(); the advisor warning is informational/by-design.
--   * auth_leaked_password_protection: an Auth project setting, not a migration.


-- =============================================================================
-- 1. confirmed_presentations: enforce "only the submitter may confirm" in the
--    policy instead of a BEFORE-INSERT trigger.
-- =============================================================================
-- 20251105065029 left the INSERT policy as WITH CHECK (true) and enforced the
-- real rule in a trigger (check_confirmer_is_submitter) that RETURN NULLs for a
-- non-submitter. Two problems:
--   * The advisor flags WITH CHECK (true) as bypassing RLS (rls_policy_always_true).
--   * A BEFORE trigger returning NULL silently drops the row -- the client's
--     insert reports success with no row written, and no error to handle.
-- Moving the predicate into WITH CHECK fixes both: a non-submitter now gets a
-- proper RLS violation error, and the policy is no longer "always true".
--
-- The subquery runs as the calling (authenticated) role under RLS. The submitter
-- can read their own submission row ("Users can select their own presentation
-- submissions", 20260522182230), so the check passes for them; for anyone else
-- RLS hides the row, the subquery yields NULL, and the INSERT is blocked
-- (fail-closed). This is the same logic the trigger applied, minus the silent drop.
DROP TRIGGER IF EXISTS block_confirming_others_presentations
  ON public.confirmed_presentations;
DROP FUNCTION IF EXISTS public.check_confirmer_is_submitter();

DROP POLICY IF EXISTS "Insert presentations if authenticated (trigger blocks others)"
  ON public.confirmed_presentations;

CREATE POLICY "Submitter can confirm own presentation"
  ON public.confirmed_presentations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT submitter_id
       FROM public.presentation_submissions
       WHERE id = confirmed_presentations.id)
      = (SELECT auth.uid())
  );


-- =============================================================================
-- 2. Revoke EXECUTE on SECURITY DEFINER trigger functions.
-- =============================================================================
-- These RETURN trigger and are never meant to be called as RPCs. PostgREST does
-- not expose trigger-returning functions, so they are not actually reachable via
-- /rest/v1/rpc -- but EXECUTE was never revoked from anon/authenticated, so the
-- advisor flags them (anon/authenticated_security_definer_function_executable).
-- Revoking is least-privilege hygiene and matches the treatment already applied
-- to store_email (20251103043909) and log_new_ticket (20260601120000). EXECUTE
-- on a trigger function is checked when the trigger is created, not when it
-- fires, so the triggers that use these functions are unaffected.
REVOKE ALL ON FUNCTION public.handle_new_user()         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_ticket_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_cache_revalidate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_ticket_sequence()  FROM PUBLIC, anon, authenticated;


-- =============================================================================
-- 3. avatars bucket: replace the broad SELECT policy with an owner-scoped one.
-- =============================================================================
-- The avatars bucket is public, so object *reads* are served by the storage
-- server without RLS: the GET object route (used by storage-js .download())
-- runs as superuser when bucket.public is true, and getPublicUrl uses the
-- unauthenticated /object/public/ endpoint. The broad "TO public USING
-- (bucket_id = 'avatars')" SELECT policy therefore mainly served to let anyone
-- list() every avatar filename (public_bucket_allows_listing) -- which the app
-- never does.
--
-- It cannot simply be dropped, though: storage *mutations* have no
-- public-bucket bypass, and delete resolves the object rows under RLS before
-- removing them (SELECT is required alongside DELETE), so without a SELECT
-- policy deleteAvatar()'s .remove() would match nothing and old avatars would
-- be orphaned. An owner-scoped SELECT keeps remove() working for the avatar's
-- owner while still blocking bucket-wide enumeration.
--
-- The DO block guards against hosted projects where storage.objects is owned
-- by supabase_storage_admin and the migration role may no longer manage its
-- policies; in that case the swap is skipped (old behaviour kept) and must be
-- applied via the dashboard instead.
DO $$
BEGIN
  DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;

  CREATE POLICY "Users can view their own avatar"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'avatars' AND (SELECT auth.uid()) = owner);
EXCEPTION WHEN insufficient_privilege THEN
  RAISE WARNING
    'avatars SELECT policy swap skipped (%). Apply it via the dashboard: drop "Avatar images are publicly accessible." and add an owner-scoped SELECT policy.',
    SQLERRM;
END
$$;

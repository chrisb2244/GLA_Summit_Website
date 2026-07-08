-- Daily cleanup of the synthetic users created by the Checkly login smoke test
-- (checkly/__checks__/login.spec.ts). That monitor registers a fresh production
-- account each run with a testmail address of the form
--   {namespace}.checkly-{unique}@inbox.testmail.app
-- Deleting from auth.users cascades to public.profiles → public.email_lookup and
-- GoTrue's own auth.* tables (identities/sessions/refresh_tokens), so a single
-- DELETE removes the whole account. A login-only synthetic user owns no rows in
-- non-cascading tables, so the delete never blocks.

create extension if not exists pg_cron;

create or replace function public.purge_synthetic_test_users()
  returns integer
  language plpgsql
  security definer
  set search_path to ''
as $$
declare
  deleted_count integer;
begin
  delete from auth.users u
  where
    -- Sentinel-scoped to the Checkly monitor's '.checkly-' tag ONLY. This regex
    -- MUST match the address built in checkly/__checks__/login.spec.ts, and MUST
    -- NOT match the Playwright suite's '{namespace}.test-{unique}@...' addresses
    -- (different tag prefix) nor any real attendee (literal testmail domain,
    -- anchored). lower() guards against any casing differences.
    lower(u.email) ~ '^[^@.]+\.checkly-[^@]+@inbox\.testmail\.app$'
    -- Age guard: never delete a user younger than the longest plausible monitor
    -- run. The in-flight smoke user is seconds old, so it can never be caught
    -- here — regardless of when this job and the Checkly run happen to align.
    -- This, not the schedule, is what prevents deleting an in-progress test.
    and u.created_at < now() - interval '12 hours';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Same lockdown as the other SECURITY DEFINER helpers in this schema
-- (store_email, handle_new_user): no direct callers from client roles.
revoke all on function public.purge_synthetic_test_users() from public;
revoke all on function public.purge_synthetic_test_users() from anon;
revoke all on function public.purge_synthetic_test_users() from authenticated;

-- 09:00 UTC daily — hours clear of the 03:00 'delete-expired-logs' job. The 12h
-- age guard above, not this hour, is what guarantees an in-flight monitor user
-- is never deleted; the offset is just tidiness. cron.schedule upserts by name.
select cron.schedule(
  'purge-synthetic-test-users',
  '0 9 * * *',
  $$select public.purge_synthetic_test_users()$$
);

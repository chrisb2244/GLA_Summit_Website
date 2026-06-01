-- Event-driven cache revalidation for externally-mutated public data.
--
-- Acceptance, scheduling (accepted_presentations) and video links (video_links)
-- are changed directly in Supabase Studio / SQL, not through the Next.js app, so
-- the app's in-process revalidateTag/updateTag calls never fire for them. These
-- triggers close that gap: on any change they POST the row to the app's
-- /api/revalidate route handler, which expires the matching Next.js cache tags.
--
-- This is the same mechanism as a Supabase "Database Webhook" (it builds the
-- identical { type, table, schema, record, old_record } payload), but defined in
-- a migration so it is reproducible across environments and local dev. We call
-- net.http_post directly rather than supabase_functions.http_request so the
-- target URL and shared secret can be read from Vault instead of being baked
-- into the trigger definition (and therefore committed to git).
--
-- CONFIGURATION (per environment — secrets are NOT stored in this migration):
--   Store two Vault secrets, then the triggers begin firing automatically. Until
--   both exist the function is a no-op, so it is safe to deploy unconfigured.
--
--     select vault.create_secret(
--       'http://host.docker.internal:3000/api/revalidate', -- prod: https://glasummit.org/api/revalidate
--       'revalidate_url');
--     select vault.create_secret(
--       '<value of SECRET_REVALIDATE_TOKEN from frontend/.env.local>',
--       'revalidate_token');
--
--   To rotate later, update in place:
--     update vault.secrets set secret = '<new>' where name = 'revalidate_token';
--
--   Local dev (WSL2): the Postgres container reaches the host dev server via
--   host.docker.internal (resolves to the docker bridge gateway). If that does
--   not route, substitute the gateway IP shown by:
--     docker exec supabase_db_gla_react sh -c "ip route | grep default"

CREATE OR REPLACE FUNCTION public.notify_cache_revalidate()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_url   text;
  v_token text;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'revalidate_url';
  SELECT decrypted_secret INTO v_token
    FROM vault.decrypted_secrets WHERE name = 'revalidate_token';

  -- No-op until both the endpoint and the shared secret are configured.
  IF v_url IS NULL OR v_token IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- net.http_post is asynchronous (it queues the request and returns), so this
  -- does not block the data change. Swallow any error regardless: a failed cache
  -- revalidation must never roll back the acceptance/scheduling/video write that
  -- triggered it — the time backstop in next.config.ts still refreshes later.
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-revalidate-secret', v_token
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_cache_revalidate failed for %.% (%): %',
      TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, SQLERRM;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Acceptance (INSERT/DELETE) and scheduling (UPDATE of scheduled_for) both
-- affect the presentation page, year list, agenda, /presenters index and each
-- presenter's page. The route handler derives the exact tags from the row.
CREATE TRIGGER accepted_presentations_revalidate
  AFTER INSERT OR UPDATE OR DELETE ON public.accepted_presentations
  FOR EACH ROW EXECUTE FUNCTION public.notify_cache_revalidate();

-- Adding/changing/removing a recording revalidates that presentation's video.
CREATE TRIGGER video_links_revalidate
  AFTER INSERT OR UPDATE OR DELETE ON public.video_links
  FOR EACH ROW EXECUTE FUNCTION public.notify_cache_revalidate();

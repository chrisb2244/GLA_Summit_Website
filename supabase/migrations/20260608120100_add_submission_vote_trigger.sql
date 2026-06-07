-- Automated acceptance / decline driven by organizer votes.
--
-- The decision rules for a single submission (applied by evaluate_submission):
--
--   ACCEPT  – every organizer has voted, at least one 'for', and zero 'against'
--             (the remainder may abstain). Requires full participation.
--   DECLINE – a for/against tie can no longer be reached, i.e.
--             against > for + not_voted, which simplifies to
--             2 * against + abstain > total_organizers. An abstain is a
--             committed non-'for' vote; only still-unvoted organizers can still
--             swing 'for'. Does NOT require full participation.
--   else    – take no automated action (stays under review).
--
-- Both rules are evaluated against the LIVE organizer count, so the result
-- depends on the current contents of public.organizers. Two triggers drive
-- re-evaluation:
--
--   * submission_votes_evaluate (per row) – fires on every vote insert/update/
--     delete and re-tallies the one affected submission. A cascade delete of an
--     organizer's votes (FK ON DELETE CASCADE) also fires this, so removing an
--     organizer who HAD voted re-tallies their submissions automatically.
--   * organizers_evaluate_after_delete (per statement) – removing an organizer
--     who had NOT voted deletes no submission_votes rows, so the per-row trigger
--     never fires; yet that removal lowers the participation bar for every
--     still-under-review submission and can newly satisfy ACCEPT/DECLINE. This
--     statement-level trigger re-evaluates all under-review submissions after any
--     delete from organizers. It is a no-op for submissions whose tally is
--     unchanged, and evaluate_submission is idempotent, so the overlap with the
--     per-row trigger (for organizers who had voted) is harmless.
--
-- Adding an organizer is deliberately NOT hooked: a larger organizer set can only
-- RAISE the bar (more votes needed to accept; a higher decline threshold), so it
-- can only move a submission toward "under review", which is the safe default. A
-- submission that already met ACCEPT would have been accepted-and-locked at the
-- final vote, so a later insert cannot retroactively change a correct outcome.
--
-- The decision is one-directional: once a submission is accepted or declined the
-- outcome row exists and (a) RLS blocks further voting and (b) ON CONFLICT DO
-- NOTHING keeps this idempotent.
--
-- The durable outcome write + best-effort notification are split out into
-- apply_submission_outcome, so a separate feature -- an organizer-forced early
-- conclusion (20260702000100) -- can reuse the exact same durable write +
-- notification by calling it directly. That keeps a single code path to the
-- accepted/rejected tables and to /api/submission-outcome. apply_submission_outcome
-- performs an UNCONDITIONAL write, so it is never callable by application roles
-- (see the REVOKE below); only the rule-bound evaluate_submission and the
-- allow-list-guarded force_submission_outcome invoke it, and as SECURITY DEFINER
-- functions they run as the owner regardless.
--
-- Inserting the outcome row is the durable action. We additionally POST the outcome
-- to the app's /api/submission-outcome route for server-side behaviour
-- (notifications etc.), using the same Vault-secret + net.http_post mechanism as
-- notify_cache_revalidate. The POST is best-effort: a failure must never roll back
-- the outcome write.
--
-- CONFIGURATION (per environment — secrets are NOT stored in this migration):
--   select vault.create_secret(
--     'http://host.docker.internal:3000/api/submission-outcome', -- prod: https://glasummit.org/api/submission-outcome
--     'submission_outcome_url');
--   select vault.create_secret(
--     '<value of SECRET_SUBMISSION_OUTCOME_TOKEN from frontend/.env.local>',
--     'submission_outcome_token');
-- Until both exist the POST is skipped (the outcome row is still written).

-- Write the outcome row for a submission and best-effort notify the app. Returns
-- the outcome ('accepted'/'declined') only when a row was newly written (so the
-- webhook fires exactly once), otherwise NULL. Idempotent via ON CONFLICT.
CREATE OR REPLACE FUNCTION public.apply_submission_outcome(
    v_pid uuid,
    v_outcome text
  )
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_written text := NULL;
  v_url     text;
  v_token   text;
BEGIN
  IF v_pid IS NULL OR v_outcome IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_outcome = 'accepted' THEN
    -- Record acceptance for the submission's year. The accepted_presentations
    -- insert also fires the existing cache-revalidation trigger.
    INSERT INTO public.accepted_presentations (id, year)
      SELECT v_pid, ps.year
      FROM public.presentation_submissions ps
      WHERE ps.id = v_pid
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      v_written := 'accepted';
    END IF;
  ELSIF v_outcome = 'declined' THEN
    INSERT INTO public.rejected_presentations (id)
      VALUES (v_pid)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      v_written := 'declined';
    END IF;
  ELSE
    RAISE EXCEPTION 'apply_submission_outcome: invalid outcome %', v_outcome;
  END IF;

  -- Best-effort notification of the (newly written) outcome. Same Vault-secret +
  -- net.http_post mechanism as notify_cache_revalidate; a failure here must never
  -- roll back the durable outcome write.
  IF v_written IS NOT NULL THEN
    SELECT decrypted_secret INTO v_url
      FROM vault.decrypted_secrets WHERE name = 'submission_outcome_url';
    SELECT decrypted_secret INTO v_token
      FROM vault.decrypted_secrets WHERE name = 'submission_outcome_token';

    IF v_url IS NOT NULL AND v_token IS NOT NULL THEN
      BEGIN
        PERFORM net.http_post(
          url := v_url,
          body := jsonb_build_object(
            'presentation_id', v_pid,
            'outcome', v_written
          ),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-submission-outcome-secret', v_token
          ),
          timeout_milliseconds := 5000
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'apply_submission_outcome notify failed for % (%): %',
          v_pid, v_written, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN v_written;
END;
$$;

-- Unconditional writer: never callable by application roles. A bare REVOKE FROM
-- PUBLIC is NOT sufficient under Supabase, whose default privileges GRANT EXECUTE
-- on new public functions to anon and authenticated explicitly, so those named
-- roles must be revoked too (matches the hygiene applied in 20260604000000).
REVOKE ALL ON FUNCTION public.apply_submission_outcome(uuid, text)
  FROM PUBLIC, anon, authenticated;

-- Re-tally a single submission and apply the accept/decline rules, delegating the
-- durable write + notification to apply_submission_outcome. Returns the outcome it
-- newly wrote ('accepted' / 'declined') or NULL if it took no action. Shared by
-- both triggers below.
CREATE OR REPLACE FUNCTION public.evaluate_submission(v_pid uuid)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_total   int;
  v_for     int;
  v_against int;
  v_abstain int;
  v_voted   int;
BEGIN
  IF v_pid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO v_total FROM public.organizers;

  SELECT
    count(*) FILTER (WHERE vote = 'for'),
    count(*) FILTER (WHERE vote = 'against'),
    count(*) FILTER (WHERE vote = 'abstain')
  INTO v_for, v_against, v_abstain
  FROM public.submission_votes
  WHERE presentation_id = v_pid;

  v_voted := v_for + v_against + v_abstain;

  IF v_total > 0 AND v_voted = v_total AND v_for >= 1 AND v_against = 0 THEN
    -- ACCEPT: every organizer voted, at least one 'for', zero 'against'.
    RETURN public.apply_submission_outcome(v_pid, 'accepted');
  ELSIF v_total > 0 AND (2 * v_against + v_abstain) > v_total THEN
    -- DECLINE: a for/against tie can no longer be reached.
    RETURN public.apply_submission_outcome(v_pid, 'declined');
  END IF;

  RETURN NULL;
END;
$$;

-- Rule-bound, but SECURITY DEFINER and not intended as an application RPC.
REVOKE ALL ON FUNCTION public.evaluate_submission(uuid)
  FROM PUBLIC, anon, authenticated;

-- Per-row trigger: re-tally the one submission touched by a vote change.
CREATE OR REPLACE FUNCTION public.evaluate_submission_votes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  PERFORM public.evaluate_submission(
    COALESCE(NEW.presentation_id, OLD.presentation_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER submission_votes_evaluate
  AFTER INSERT OR UPDATE OR DELETE ON public.submission_votes
  FOR EACH ROW EXECUTE FUNCTION public.evaluate_submission_votes();

-- Statement-level trigger: an organizer was removed. Any cascade-deleted votes
-- already re-tallied their own submissions via the per-row trigger, but removing
-- a non-voting organizer leaves no vote rows to cascade — so re-evaluate every
-- submission still under review against the new (smaller) organizer count. Runs
-- once per statement, after all cascades complete, so the organizer count and
-- vote tallies it reads are final.
CREATE OR REPLACE FUNCTION public.evaluate_under_review_submissions()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_pid uuid;
BEGIN
  FOR v_pid IN
    SELECT ps.id
    FROM public.presentation_submissions ps
    WHERE ps.is_submitted = true
      AND NOT EXISTS (
        SELECT 1 FROM public.accepted_presentations ap WHERE ap.id = ps.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.rejected_presentations rp WHERE rp.id = ps.id
      )
  LOOP
    PERFORM public.evaluate_submission(v_pid);
  END LOOP;
  RETURN NULL;
END;
$$;

-- Trigger functions are SECURITY DEFINER and not reachable as RPCs (PostgREST does
-- not expose trigger-returning functions); revoke EXECUTE for least-privilege
-- hygiene, matching 20260604000000.
REVOKE ALL ON FUNCTION public.evaluate_submission_votes()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.evaluate_under_review_submissions()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER organizers_evaluate_after_delete
  AFTER DELETE ON public.organizers
  FOR EACH STATEMENT EXECUTE FUNCTION public.evaluate_under_review_submissions();

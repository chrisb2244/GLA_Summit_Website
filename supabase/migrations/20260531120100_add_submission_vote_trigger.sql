-- Automated acceptance / decline driven by organizer votes.
--
-- After every change to submission_votes, re-tally the affected presentation and
-- apply the agreed rules:
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
-- The decision is one-directional: once a submission is accepted or declined the
-- outcome row exists and (a) RLS blocks further voting and (b) ON CONFLICT DO
-- NOTHING keeps this idempotent.
--
-- Inserting the outcome row is the durable action. We additionally POST the
-- outcome to the app's /api/submission-outcome route for future server-side
-- behaviour (notifications etc.) — currently a no-op — using the same
-- Vault-secret + net.http_post mechanism as notify_cache_revalidate. The POST is
-- best-effort: a failure must never roll back the outcome write.
--
-- CONFIGURATION (per environment — secrets are NOT stored in this migration):
--   select vault.create_secret(
--     'http://host.docker.internal:3000/api/submission-outcome', -- prod: https://glasummit.org/api/submission-outcome
--     'submission_outcome_url');
--   select vault.create_secret(
--     '<value of SECRET_SUBMISSION_OUTCOME_TOKEN from frontend/.env.local>',
--     'submission_outcome_token');
-- Until both exist the POST is skipped (the outcome row is still written).

CREATE OR REPLACE FUNCTION public.evaluate_submission_votes()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_pid        uuid;
  v_total      int;
  v_for        int;
  v_against    int;
  v_abstain    int;
  v_voted      int;
  v_outcome    text := NULL;
  v_url        text;
  v_token      text;
BEGIN
  v_pid := COALESCE(NEW.presentation_id, OLD.presentation_id);

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
    -- ACCEPT: record acceptance for the submission's year. The accepted_presentations
    -- insert also fires the existing cache-revalidation trigger.
    INSERT INTO public.accepted_presentations (id, year)
      SELECT v_pid, ps.year
      FROM public.presentation_submissions ps
      WHERE ps.id = v_pid
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      v_outcome := 'accepted';
    END IF;
  ELSIF v_total > 0 AND (2 * v_against + v_abstain) > v_total THEN
    -- DECLINE: a for/against tie can no longer be reached.
    INSERT INTO public.rejected_presentations (id)
      VALUES (v_pid)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN
      v_outcome := 'declined';
    END IF;
  END IF;

  -- Best-effort notification of the (newly written) outcome.
  IF v_outcome IS NOT NULL THEN
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
            'outcome', v_outcome
          ),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-submission-outcome-secret', v_token
          ),
          timeout_milliseconds := 5000
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'evaluate_submission_votes notify failed for % (%): %',
          v_pid, v_outcome, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER submission_votes_evaluate
  AFTER INSERT OR UPDATE OR DELETE ON public.submission_votes
  FOR EACH ROW EXECUTE FUNCTION public.evaluate_submission_votes();

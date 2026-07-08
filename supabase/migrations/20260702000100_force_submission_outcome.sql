-- Force an early submission outcome, bypassing the organizer-vote tally.
--
-- Restricted to the submission_concluders allow-list (checked here as well as in
-- the UI), and only while the submission is still under review. Converges on the
-- same apply_submission_outcome path (defined alongside the vote trigger in
-- 20260608120100) as the vote-driven flow, so the outcome row and the
-- /api/submission-outcome webhook (and thus the emails) fire identically.
--
-- A vote-driven outcome is self-explanatory from submission_votes, but a forced
-- conclusion can accept/decline a submission with only partial votes. The
-- forced_conclusions audit table records who forced it and when, so organizers can
-- see on the review page why a submission was concluded early and by whom.
CREATE TABLE IF NOT EXISTS public.forced_conclusions (
    presentation_id uuid PRIMARY KEY
      REFERENCES public.presentation_submissions(id) ON DELETE CASCADE,
    outcome   text NOT NULL CHECK (outcome IN ('accepted', 'declined')),
    -- Keep the audit row if the organizer is later removed; the UI falls back to
    -- a generic label. (Organizers can be removed, which re-evaluates outcomes.)
    forced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    forced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.forced_conclusions ENABLE ROW LEVEL SECURITY;

-- Organizers may read the audit trail (to render it on the review page). Rows are
-- only ever written by force_submission_outcome (SECURITY DEFINER, runs as owner),
-- so all write privileges are revoked from every application role -- see the note in
-- 20260702000000 on why RLS alone would not stop service_role.
CREATE POLICY "Organizers can read forced conclusions"
  ON public.forced_conclusions
  FOR SELECT
  TO authenticated
  USING (public.is_organizer());

REVOKE ALL ON public.forced_conclusions
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.forced_conclusions TO authenticated;

-- Force an early outcome. Restricted to the submission_concluders allow-list
-- (checked here via auth.uid()) and only while still under review. Delegates the
-- durable write + webhook to apply_submission_outcome, then records the audit row
-- -- but only when the outcome was newly written (apply_submission_outcome returns
-- non-NULL), so a no-op force does not leave a misleading trail.
CREATE OR REPLACE FUNCTION public.force_submission_outcome(
    v_pid uuid,
    v_outcome text
  )
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_written text;
BEGIN
  IF v_outcome NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'force_submission_outcome: invalid outcome %', v_outcome;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.submission_concluders WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'force_submission_outcome: not authorized';
  END IF;

  IF EXISTS (SELECT 1 FROM public.accepted_presentations WHERE id = v_pid)
     OR EXISTS (SELECT 1 FROM public.rejected_presentations WHERE id = v_pid) THEN
    RAISE EXCEPTION 'force_submission_outcome: submission already concluded';
  END IF;

  v_written := public.apply_submission_outcome(v_pid, v_outcome);

  IF v_written IS NOT NULL THEN
    INSERT INTO public.forced_conclusions (presentation_id, outcome, forced_by)
      VALUES (v_pid, v_written, auth.uid())
    ON CONFLICT (presentation_id) DO NOTHING;
  END IF;

  RETURN v_written;
END;
$$;

-- The app calls this as the logged-in organizer; it self-authorizes against the
-- concluders allow-list. Grant EXECUTE to authenticated only (revoke the rest).
REVOKE ALL ON FUNCTION public.force_submission_outcome(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.force_submission_outcome(uuid, text) TO authenticated;

-- Organizer voting on submitted presentations.
--
-- Each organizer records a 'for' / 'abstain' / 'against' vote per submission on
-- the /review-submissions page. The acceptance/decline workflow is driven by a
-- trigger (added in the following migration); this migration only defines the
-- vote storage, its RLS, and the supporting read paths the review page needs.

-- Whether the current user is an organizer. SECURITY DEFINER so it bypasses RLS
-- on the organizers table: policies that need an organizer check must use this
-- rather than a `SELECT id FROM organizers` subquery, which would recurse when
-- used in a policy on the organizers table itself.
CREATE OR REPLACE FUNCTION public.is_organizer()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  SET search_path = ''
  AS $$
    SELECT EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid());
  $$;

-- The three vote choices. Absence of a row means the organizer has not voted.
CREATE TYPE public.organizer_vote AS ENUM ('for', 'abstain', 'against');

-- One row per (presentation, organizer). Changing a vote is an UPSERT; clearing
-- it (back to "not voted") is a DELETE.
CREATE TABLE public.submission_votes (
  presentation_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON DELETE CASCADE,
  organizer_id    uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  vote            public.organizer_vote NOT NULL,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (presentation_id, organizer_id)
);
ALTER TABLE public.submission_votes ENABLE ROW LEVEL SECURITY;
-- Aid the per-presentation tally the trigger and review page run.
CREATE INDEX submission_votes_presentation_idx ON public.submission_votes(presentation_id);

-- Table privileges (RLS is layered on top of these grants). anon gets no access:
-- Supabase's default privileges GRANT full DML on new public tables to anon (as a
-- named role, not via PUBLIC), so "no anon access" needs an explicit REVOKE, not
-- merely omitting the GRANT. RLS would block anon regardless, but revoking keeps the
-- privilege surface honest and matches the intent stated here.
REVOKE ALL ON public.submission_votes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_votes TO service_role;

-- Any organizer may read every vote (the review UI shows how each organizer
-- voted, and who has not).
CREATE POLICY "Organizers can read all submission votes"
  ON public.submission_votes
  FOR SELECT
  TO authenticated
  USING (public.is_organizer());

-- Writes are restricted to the organizer's own row AND only while the
-- presentation is still under review: once an outcome row exists in
-- accepted_presentations / rejected_presentations, voting is locked. The same
-- lock is enforced again in the server action and the UI.
CREATE POLICY "Organizers can cast their own vote while under review"
  ON public.submission_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = (SELECT auth.uid())
    AND public.is_organizer()
    AND presentation_id NOT IN (SELECT accepted_presentations.id FROM public.accepted_presentations)
    AND presentation_id NOT IN (SELECT rejected_presentations.id FROM public.rejected_presentations)
  );
CREATE POLICY "Organizers can change their own vote while under review"
  ON public.submission_votes
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id = (SELECT auth.uid())
    AND presentation_id NOT IN (SELECT accepted_presentations.id FROM public.accepted_presentations)
    AND presentation_id NOT IN (SELECT rejected_presentations.id FROM public.rejected_presentations)
  )
  WITH CHECK (
    organizer_id = (SELECT auth.uid())
    AND public.is_organizer()
  );
CREATE POLICY "Organizers can clear their own vote while under review"
  ON public.submission_votes
  FOR DELETE
  TO authenticated
  USING (
    organizer_id = (SELECT auth.uid())
    AND presentation_id NOT IN (SELECT accepted_presentations.id FROM public.accepted_presentations)
    AND presentation_id NOT IN (SELECT rejected_presentations.id FROM public.rejected_presentations)
  );

-- Organizers need to see each other to display the vote record. The base
-- organizers policy only exposes the caller's own row; add a policy letting any
-- organizer list the full organizer set.
CREATE POLICY "Organizers can list all organizers"
  ON public.organizers
  FOR SELECT
  TO authenticated
  USING (public.is_organizer());

-- The review page splits submissions into under-review / accepted / declined.
-- accepted_presentations is already publicly selectable; rejected_presentations
-- is presenter-self only, so let organizers read it for the Declined bucket.
CREATE POLICY "Organizers can read rejected presentations"
  ON public.rejected_presentations
  FOR SELECT
  TO authenticated
  USING (public.is_organizer());

-- Names for the vote record without widening profiles RLS: a SECURITY DEFINER
-- function returning the organizer directory, callable only by organizers.
CREATE OR REPLACE FUNCTION public.get_organizer_directory()
  RETURNS TABLE(id uuid, firstname text, lastname text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
  AS $$
    BEGIN
      IF (SELECT count(*) FROM organizers WHERE organizers.id = auth.uid()) != 1 THEN
        -- Not an organizer: return nothing.
        RETURN;
      END IF;

      RETURN QUERY
      SELECT p.id, p.firstname, p.lastname
      FROM organizers o
        JOIN profiles p ON p.id = o.id;
    END;
  $$;

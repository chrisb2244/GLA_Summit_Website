-- The UPDATE policy had no WITH CHECK clause, so Postgres used the USING expression
-- for both the row filter and the post-update check. This meant setting is_submitted = true
-- always failed because the new row no longer satisfied is_submitted = false.
--
-- Fix: keep USING to restrict updates to draft rows owned by the user, but add
-- WITH CHECK that only enforces ownership so is_submitted can be flipped to true.
DROP POLICY "Users can update their draft presentations" ON public.presentation_submissions;

CREATE POLICY "Users can update their draft presentations"
  ON public.presentation_submissions
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid()) = submitter_id) AND (is_submitted = false))
  WITH CHECK ((SELECT auth.uid()) = submitter_id);

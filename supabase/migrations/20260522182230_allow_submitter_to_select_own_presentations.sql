-- Although submitters and copresenters have the ability to read their presentations
-- via a different policy, during insertion the presentation_presenters table
-- is not populated with the new row, so that policy prevents looking up the new id value.
CREATE POLICY "Users can select their own presentation submissions"
  ON public.presentation_submissions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = submitter_id);

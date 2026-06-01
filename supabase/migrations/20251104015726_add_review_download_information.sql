-- Create the table for review download information
CREATE TABLE IF NOT EXISTS public.review_download_information (
  presentation_id UUID NOT NULL REFERENCES presentation_submissions (id) ON UPDATE CASCADE ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users (id) DEFAULT auth.uid(),
  last_downloaded TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (presentation_id, viewer_id)
);
-- Enable Row-Level Security (RLS) on the table
ALTER TABLE review_download_information ENABLE ROW LEVEL SECURITY;
-- Create a policy to allow the user to select rows with their user_id
CREATE POLICY select_policy ON review_download_information
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = viewer_id);
-- Create a policy to allow the user to insert rows with their user_id
CREATE POLICY insert_policy ON review_download_information
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = viewer_id);
-- Create a policy to allow the user to update rows with their user_id
CREATE POLICY update_policy ON review_download_information
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = viewer_id)
  WITH CHECK ((SELECT auth.uid()) = viewer_id);

-- Ensure review pages only include finalized submissions.
CREATE OR REPLACE FUNCTION public.get_reviewable_submissions(target_year public.summit_year)
  RETURNS TABLE(
    presentation_id uuid,
    title text,
    abstract text,
    presentation_type public.presentation_type,
    learning_points text,
    submitter_id uuid,
    presenters public.presenter_info[],
    updated_at timestamptz
  )
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $$
    BEGIN
      IF (SELECT count(*) FROM organizers WHERE id = auth.uid()) != 1 then
        -- Not an organizer
        RETURN;
      END IF;

      RETURN QUERY
      SELECT
        ps.id,
        ps.title,
        ps.abstract,
        ps.presentation_type,
        ps.learning_points,
        ps.submitter_id,
        array_agg( row(p.id, p.firstname, p.lastname)::presenter_info ),
        ps.updated_at
      FROM presentation_submissions ps
        JOIN presentation_presenters pp ON pp.presentation_id = ps.id
        JOIN profiles p ON p.id = pp.presenter_id
      WHERE ps.year = target_year
        AND ps.is_submitted = true
      GROUP BY ps.id;
    END;
  $$;

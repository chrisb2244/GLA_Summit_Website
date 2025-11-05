-- Create a table to track when groups of presentations
-- (e.g. 7x7, 3x15) are scheduled together.
-- This aids generating agenda views.
CREATE TABLE IF NOT EXISTS public.container_groups (
  container_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  presentation_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (container_id, presentation_id)
);
ALTER TABLE public.container_groups ENABLE ROW LEVEL SECURITY;

-- Create policies to access
CREATE POLICY "Container groups are viewable"
  ON public.container_groups
  FOR SELECT
  USING (true);

CREATE POLICY "Submissions are viewable if containers"
  ON public.presentation_submissions
  FOR SELECT
  USING ((
    id IN (
      SELECT container_groups.container_id
      FROM public.container_groups
    )
  ));


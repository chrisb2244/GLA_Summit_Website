-- Create a table for the video links from completed presentations
CREATE TABLE public.video_links (
    presentation_id uuid
      PRIMARY KEY
      REFERENCES public.presentation_submissions(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    url text
);
ALTER TABLE public.video_links ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow access
CREATE POLICY "Enable read access for all users"
  ON public.video_links
  FOR SELECT
  TO public
  USING (true);

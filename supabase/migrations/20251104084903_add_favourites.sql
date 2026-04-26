-- Create a table to store favourites
CREATE TABLE IF NOT EXISTS public.agenda_favourites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  presentation_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON DELETE CASCADE,
  updated_at timestamp with time zone DEFAULT "now"() NOT NULL,
  PRIMARY KEY (user_id, presentation_id)
);
ALTER TABLE public.agenda_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can modify their own favourites"
  ON public.agenda_favourites
  FOR ALL
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
  );

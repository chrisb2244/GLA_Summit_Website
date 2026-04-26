-- Create the organizers table
CREATE TABLE IF NOT EXISTS public.organizers (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
-- Add policies for the organizers table
CREATE POLICY "Organizers can check their existence"
  ON public.organizers
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
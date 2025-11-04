CREATE TABLE IF NOT EXISTS public.timezone_preferences (
    id uuid PRIMARY KEY REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    timezone_db text NOT NULL,
    timezone_name text NOT NULL,
    use_24h_clock boolean DEFAULT false NOT NULL
);
ALTER TABLE public.timezone_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can modify their timezone preferences"
  ON public.timezone_preferences
  TO authenticated
  USING (
    ((SELECT auth.uid() AS uid) = id)
  ) 
  WITH CHECK (
    ((SELECT auth.uid() AS uid) = id)
  );

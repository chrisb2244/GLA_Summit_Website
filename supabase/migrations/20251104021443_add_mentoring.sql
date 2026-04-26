CREATE TABLE IF NOT EXISTS public.mentoring (
  email text PRIMARY KEY,
  firstname text NOT NULL,
  lastname text NOT NULL,
  entry_type public.mentoring_type NOT NULL,
  created_at timestamptz DEFAULT "now"() NOT NULL
);
ALTER TABLE public.mentoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register if email not in profiles"
  ON public.mentoring
  FOR INSERT
  WITH CHECK (
    (NOT (email IN 
      (SELECT mentoring.email FROM public.profiles)
    ))
  );

CREATE POLICY "Logged in users can register their own email"
  ON public.mentoring
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email IN (
      SELECT mentoring.email
      FROM public.profiles
      WHERE (profiles.id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can read their own status"
  ON public.mentoring
  FOR SELECT
  USING (
    (email IN (
      SELECT mentoring.email
      FROM public.profiles
      WHERE (profiles.id = (SELECT auth.uid()))
    ))
  );

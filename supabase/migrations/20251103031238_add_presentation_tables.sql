-- Not all policies in this migration file are adjacent to their subject tables.
-- This is because some require other tables for the checks (and are defined after
-- those tables).

-- Create the presentation_submissions table
CREATE TABLE IF NOT EXISTS public.presentation_submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    submitter_id uuid NOT NULL REFERENCES public.profiles(id),
    updated_at timestamptz DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    title text NOT NULL,
    abstract text NOT NULL,
    is_submitted boolean NOT NULL,
    presentation_type public.presentation_type NOT NULL,
    learning_points text,
    year public.summit_year NOT NULL
);
ALTER TABLE public.presentation_submissions ENABLE ROW LEVEL SECURITY;
-- Add index to aid JOINs
CREATE INDEX presentation_submissions_submitter_idx ON public.presentation_submissions(submitter_id);
-- Add policies
CREATE POLICY "Organizers can select submitted presentations"
  ON public.presentation_submissions
  FOR SELECT
  TO authenticated
  USING ((
    (is_submitted = true) AND
    ((SELECT auth.uid()) IN (SELECT organizers.id FROM public.organizers))
  ));
-- CREATE POLICY "Users can select their own presentation submissions"
--   ON public.presentation_submissions
--   FOR SELECT
--   TO authenticated
--   USING ((SELECT auth.uid()) = submitter_id);
CREATE POLICY "Users can insert their own presentation submissions"
  ON public.presentation_submissions
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = submitter_id); -- extra paren?
CREATE POLICY "Users can update their draft presentations"
  ON public.presentation_submissions
  FOR UPDATE
  TO authenticated
  USING (((SELECT auth.uid()) = submitter_id) AND (is_submitted = false)); -- extra paren?
CREATE POLICY "Users can delete their draft presentations"
  ON public.presentation_submissions
  FOR DELETE
  TO authenticated
  USING (((SELECT auth.uid()) = submitter_id) AND (is_submitted = false)); -- may need extra paren


-- Create the bridge presentation_presenters table
CREATE TABLE IF NOT EXISTS public.presentation_presenters (
    presentation_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON DELETE CASCADE,
    presenter_id uuid NOT NULL REFERENCES public.profiles(id),
    PRIMARY KEY (presentation_id, presenter_id)
);
ALTER TABLE public.presentation_presenters ENABLE ROW LEVEL SECURITY;
-- Add separate indexes to aid JOINs
CREATE INDEX presentation_presenters_presentation_idx ON public.presentation_presenters(presentation_id);
CREATE INDEX presentation_presenters_presenter_idx ON public.presentation_presenters(presenter_id);
-- Add policies, including (more) for the presentation_submissions table.
CREATE POLICY "Presenters can find their own entries"
  ON public.presentation_presenters
  FOR SELECT
  TO authenticated
  USING ((presenter_id = (SELECT(auth.uid()))));
CREATE POLICY "Organizers can query table"
  ON public.presentation_presenters
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT organizers.id FROM public.organizers)); -- extra paren?
CREATE POLICY "Presenters and co-presenters can select their presentations"
  ON public.presentation_submissions
  FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.uid() AS uid) IN (
      SELECT pp.presenter_id
      FROM public.presentation_presenters pp
      WHERE (pp.presentation_id = presentation_submissions.id)
    ))
  );
CREATE POLICY "Organizers can view profiles of presentation submitters"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((
    (id IN (
      SELECT presentation_presenters.presenter_id
      FROM public.presentation_presenters) AND
    (SELECT auth.uid()) IN (SELECT organizers.id FROM public.organizers))
  ));


-- Create the accepted_presentations table
CREATE TABLE IF NOT EXISTS public.accepted_presentations (
    id uuid PRIMARY KEY REFERENCES public.presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    accepted_at timestamptz DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    scheduled_for timestamptz,
    year public.summit_year NOT NULL
);
ALTER TABLE public.accepted_presentations ENABLE ROW LEVEL SECURITY;
-- Add policies
CREATE POLICY "accepted_presentations are viewable"
  ON public.accepted_presentations
  FOR SELECT
  USING (true);
CREATE POLICY "Submissions are viewable if accepted"
  ON public.presentation_submissions
  FOR SELECT
  USING ((
    id IN (SELECT accepted_presentations.id FROM public.accepted_presentations)
  ));
CREATE POLICY "Accepted presenters profiles are viewable"
  ON public.profiles
  FOR SELECT
  USING (
    id IN (
      SELECT pp.presenter_id
      FROM public.accepted_presentations
      LEFT JOIN public.presentation_presenters pp
        ON pp.presentation_id = accepted_presentations.id
    )
  );
CREATE POLICY "List presenters if presentation accepted"
  ON public.presentation_presenters
  FOR SELECT
  USING (
    presentation_id IN (
      SELECT accepted_presentations.id
      FROM public.accepted_presentations
    )
  );

-- Create the rejected_presentations table
CREATE TABLE public.rejected_presentations (
    id uuid PRIMARY KEY REFERENCES public.presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE public.rejected_presentations ENABLE ROW LEVEL SECURITY;
-- Add policies
CREATE POLICY "Presenters can select their own rejected presentations"
ON public.rejected_presentations
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid()) IN ( SELECT pp.presenter_id
    FROM presentation_presenters pp
    WHERE (pp.presentation_id = rejected_presentations.id))));
-- Create a table to track when submitters confirm their presentations after acceptance
CREATE TABLE public.confirmed_presentations (
    id uuid PRIMARY KEY REFERENCES public.accepted_presentations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.confirmed_presentations ENABLE ROW LEVEL SECURITY;

-- Create a function and a trigger to confirm the person 
-- 'confirming' is in fact the submitter
CREATE OR REPLACE FUNCTION public.check_confirmer_is_submitter()
 RETURNS trigger
 LANGUAGE plpgsql
  AS $$
    BEGIN
      IF ((SELECT submitter_id FROM presentation_submissions WHERE id = new.id) = auth.uid()) THEN
        RETURN new;
      ELSE
        RETURN NULL;
      END IF;
    END;
  $$;
CREATE TRIGGER block_confirming_others_presentations
  BEFORE INSERT ON public.confirmed_presentations
  FOR EACH ROW
  EXECUTE FUNCTION check_confirmer_is_submitter();

CREATE POLICY "Insert presentations if authenticated (trigger blocks others)"
  ON public.confirmed_presentations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Block selecting the created_at column.
-- The list of IDs can be public (to aid generation of pages, etc),
-- but the dates allow reading private information about when the
-- submitter confirmed the presentation (which need not be generally
-- accessible)
CREATE POLICY "authenticated users can select"
  ON public.confirmed_presentations
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE
  SELECT (created_at)
  ON TABLE public.confirmed_presentations
  FROM authenticated;

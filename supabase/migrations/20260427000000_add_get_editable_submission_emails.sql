-- Return presenter emails for a single submission, scoped to users who are
-- presenters on that same submission.
CREATE OR REPLACE FUNCTION public.get_editable_submission_emails(
  p_presentation_id uuid
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_can_access boolean;
  presenter_emails text[];
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.presentation_presenters pp
    WHERE pp.presentation_id = p_presentation_id
      AND pp.presenter_id = auth.uid()
  )
  INTO user_can_access;

  IF NOT user_can_access THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(array_agg(el.email ORDER BY el.email), ARRAY[]::text[])
  INTO presenter_emails
  FROM public.presentation_presenters pp
  JOIN public.email_lookup el
    ON el.id = pp.presenter_id
  WHERE pp.presentation_id = p_presentation_id;

  RETURN presenter_emails;
END;
$$;

REVOKE ALL ON FUNCTION public.get_editable_submission_emails(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_editable_submission_emails(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_editable_submission_emails(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_editable_submission_emails(uuid) TO service_role;

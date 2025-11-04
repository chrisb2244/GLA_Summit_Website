-- Function that returns all presentations
-- This function obeys RLS (it is INVOKER, not DEFINER)
CREATE OR REPLACE FUNCTION public.get_all_presentations()
  RETURNS TABLE(
    presentation_id uuid,
    scheduled_for timestamptz,
    year summit_year,
    title text,
    abstract text,
    presentation_type presentation_type,
    primary_presenter uuid,
    all_presenters uuid[],
    all_presenters_names text[],
    all_presenter_firstnames text[],
    all_presenter_lastnames text[]
  )
  LANGUAGE sql
  SET search_path TO 'public'
  SECURITY INVOKER
  AS $function$
    SELECT
      ap.id as presentation_id,
      scheduled_for,
      ap.year,
      p.title,
      p.abstract,
      p.presentation_type,
      p.submitter_id as primary_presenter,
      p.all_presenters,
      p.all_presenters_names,
      p.all_presenter_firstnames,
      p.all_presenter_lastnames
    FROM
      accepted_presentations ap
    JOIN (
      SELECT
        ps.id,
        ps.title,
        ps.abstract,
        ps.presentation_type,
        ps.submitter_id,
        array_agg(ppn.presenter_id) AS all_presenters,
        array_agg(coalesce(trim(coalesce(ppn.firstname, '') || ' ' || coalesce(ppn.lastname, '')), '')) AS all_presenters_names,
        array_agg(coalesce(ppn.firstname, '')) AS all_presenter_firstnames,
        array_agg(coalesce(ppn.lastname, '')) AS all_presenter_lastnames
      FROM
        presentation_submissions ps
        JOIN (
          SELECT
            pp.presentation_id,
            pp.presenter_id,
            prof.firstname,
            prof.lastname
          FROM
            presentation_presenters pp
            INNER JOIN profiles prof ON pp.presenter_id = prof.id
        ) ppn ON ps.id = ppn.presentation_id
      GROUP BY
        ps.id
    ) p USING (id)
  $function$;

-- Add a view that wraps the function.
-- CREATE OR REPLACE VIEW public.all_presentations AS SELECT
--     gap.presentation_id,
--     gap.scheduled_for,
--     gap.year,
--     gap.title,
--     gap.abstract,
--     gap.presentation_type,
--     gap.primary_presenter,
--     gap.all_presenters,
--     gap.all_presenters_names,
--     gap.all_presenter_firstnames,
--     gap.all_presenter_lastnames
--    FROM get_all_presentations() gap(
--     presentation_id,
--     scheduled_for,
--     year,
--     title,
--     abstract,
--     presentation_type,
--     primary_presenter,
--     all_presenters,
--     all_presenters_names,
--     all_presenter_firstnames,
--     all_presenter_lastnames
--   );

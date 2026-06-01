-- Add updated_at to get_my_submissions() so the My Presentations page can show
-- when drafts were last saved.

DROP FUNCTION IF EXISTS public.get_my_submissions();

CREATE OR REPLACE FUNCTION public.get_my_submissions()
 RETURNS TABLE(
   presentation_id uuid,
   title text,
   abstract text,
   learning_points text,
   presentation_type presentation_type,
   submitter_id uuid,
   is_submitted boolean,
   year summit_year,
   updated_at timestamptz,
   all_presenters_ids uuid[],
   all_firstnames text[],
   all_lastnames text[]
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
SELECT
      ps.id as presentation_id,
      ps.title,
      ps.abstract,
      ps.learning_points,
      ps.presentation_type,
      ps.submitter_id,
      ps.is_submitted,
      ps.year,
      ps.updated_at,
      array_agg(ppn.presenter_id) as all_presenters,
      array_agg(ppn.firstname) as all_firstnames,
      array_agg(ppn.lastname) as all_lastnames
    FROM public.presentation_submissions ps
    JOIN (
      SELECT
        pp.presentation_id,
        pp.presenter_id,
        prof.firstname,
        prof.lastname
      FROM public.presentation_presenters pp
      LEFT JOIN public.profiles prof
        ON pp.presenter_id = prof.id
    ) ppn on ps.id = ppn.presentation_id
    WHERE presentation_id IN (
      SELECT presentation_id
      FROM public.presentation_presenters ppp
      WHERE ppp.presenter_id = auth.uid()
    )
    GROUP BY ps.id;
  $function$;

REVOKE ALL ON FUNCTION public.get_my_submissions FROM public;
REVOKE ALL ON FUNCTION public.get_my_submissions FROM anon;

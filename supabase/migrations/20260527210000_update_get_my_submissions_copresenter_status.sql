-- Update get_my_submissions to include co-presenter status and emails.
-- Names are only returned when status = 'accepted' to prevent enumeration attacks:
-- this RPC is called from the browser client and its response is directly reachable
-- via curl with a valid auth token.

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
   all_lastnames text[],
   all_presenter_emails text[],
   all_presenter_statuses text[]
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
      array_agg(ppn.presenter_id) as all_presenters_ids,
      array_agg(ppn.firstname) as all_firstnames,
      array_agg(ppn.lastname) as all_lastnames,
      array_agg(ppn.email) as all_presenter_emails,
      array_agg(ppn.status) as all_presenter_statuses
    FROM public.presentation_submissions ps
    JOIN (
      SELECT
        pp.presentation_id,
        pp.presenter_id,
        pp.status,
        CASE WHEN pp.status = 'accepted' THEN prof.firstname ELSE NULL END AS firstname,
        CASE WHEN pp.status = 'accepted' THEN prof.lastname ELSE NULL END AS lastname,
        el.email
      FROM public.presentation_presenters pp
      LEFT JOIN public.profiles prof
        ON pp.presenter_id = prof.id
      LEFT JOIN public.email_lookup el
        ON pp.presenter_id = el.id
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
GRANT EXECUTE ON FUNCTION public.get_my_submissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_submissions TO service_role;

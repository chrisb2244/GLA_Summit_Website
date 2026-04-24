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
   all_lastnames text[],
   all_emails text[]
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

select
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
  array_agg(ppn.email) as all_emails
from
  presentation_submissions ps

  join (
    select
      pp.presentation_id,
      pp.presenter_id,
      prof.firstname,
      prof.lastname,
      get_email_by_id(pp.presenter_id) as email
    from
      presentation_presenters pp
      left join profiles prof on pp.presenter_id = prof.id
  ) ppn on ps.id = ppn.presentation_id
  where presentation_id in (
    select presentation_id
    from presentation_presenters ppp
    where ppp.presenter_id = auth.uid()
  )
group by
  ps.id;

$function$;

drop view if exists "public"."my_submissions";

create or replace view "public"."my_submissions" as
  SELECT
    get_my_submissions.presentation_id,
    get_my_submissions.title,
    get_my_submissions.abstract,
    get_my_submissions.learning_points,
    get_my_submissions.presentation_type,
    get_my_submissions.submitter_id,
    get_my_submissions.is_submitted,
    get_my_submissions.year,
    get_my_submissions.updated_at,
    get_my_submissions.all_presenters_ids,
    get_my_submissions.all_firstnames,
    get_my_submissions.all_lastnames,
    get_my_submissions.all_emails
  FROM get_my_submissions() get_my_submissions(
    presentation_id, title, abstract, learning_points,
    presentation_type, submitter_id, is_submitted, year, updated_at,
    all_presenters_ids, all_firstnames, all_lastnames, all_emails
  );

-- Re-apply the same grants as the original view.
GRANT ALL ON TABLE "public"."my_submissions" TO "anon";
GRANT ALL ON TABLE "public"."my_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."my_submissions" TO "service_role";

GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "service_role";

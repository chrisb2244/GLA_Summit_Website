set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.ticket_number := nextval('ticket_sequence_' || NEW.year);
  RETURN NEW;
end
$function$
;

CREATE OR REPLACE FUNCTION public.check_confirmer_is_submitter()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  IF ((SELECT submitter_id from presentation_submissions where id = new.id) = auth.uid()) then
    return new;
  else
    return null;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_ticket_sequence()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if NEW.name is null then
    NEW.name := ('ticket_sequence_' || NEW.year);
  end if;
  execute format('CREATE SEQUENCE IF NOT EXISTS %s', NEW.name);
  return NEW;
end
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_presentations()
 RETURNS TABLE(presentation_id uuid, scheduled_for timestamp with time zone, year summit_year, title text, abstract text, presentation_type presentation_type, primary_presenter uuid, all_presenters uuid[], all_presenters_names text[], all_presenter_firstnames text[], all_presenter_lastnames text[])
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$

select
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
from
  accepted_presentations ap
  join (
    select
      ps.id,
      ps.title,
      ps.abstract,
      ps.presentation_type,
      ps.submitter_id,
      array_agg(ppn.presenter_id) as all_presenters,
      array_agg(coalesce(trim(coalesce(ppn.firstname, '') || ' ' || coalesce(ppn.lastname, '')), '')) as all_presenters_names,
      array_agg(coalesce(ppn.firstname, '')) as all_presenter_firstnames,
      array_agg(coalesce(ppn.lastname, '')) as all_presenter_lastnames
    from
      presentation_submissions ps
      join (
        select
          pp.presentation_id,
          pp.presenter_id,
          prof.firstname,
          prof.lastname
        from
          presentation_presenters pp
          inner join profiles prof on pp.presenter_id = prof.id
      ) ppn on ps.id = ppn.presentation_id
    group by
      ps.id
  ) p using (id)
  
  $function$
;

CREATE OR REPLACE FUNCTION public.get_email_by_id(user_id uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'auth'
AS $function$
select email from auth.users where id=user_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_submissions()
 RETURNS TABLE(presentation_id uuid, title text, abstract text, learning_points text, presentation_type presentation_type, submitter_id uuid, is_submitted boolean, year summit_year, all_presenters_ids uuid[], all_firstnames text[], all_lastnames text[], all_emails text[])
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
  array_agg(ppn.presenter_id) as all_presenters,
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
  where presentation_id in (select presentation_id from presentation_presenters ppp where ppp.presenter_id = auth.uid())
group by
  ps.id;

  $function$
;

CREATE OR REPLACE FUNCTION public.get_presentation_ids()
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_presentation_ids(p_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$function$
;

CREATE OR REPLACE FUNCTION public.get_reviewable_submissions(target_year summit_year)
 RETURNS TABLE(presentation_id uuid, title text, abstract text, presentation_type presentation_type, learning_points text, submitter_id uuid, presenters presenter_info[], updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- IF (SELECT count(*) FROM organizers WHERE id = auth.uid()) != 1 then
  --   -- Not an organizer
  --   RETURN;
  -- END IF;

  RETURN QUERY
  SELECT 
    ps.id,
    ps.title,
    ps.abstract,
    ps.presentation_type,
    ps.learning_points,
    ps.submitter_id,
    array_agg( row(p.id, p.firstname, p.lastname)::presenter_info ),
    ps.updated_at
  FROM presentation_submissions ps 
    JOIN presentation_presenters pp ON pp.presentation_id = ps.id
    JOIN profiles p ON p.id = pp.presenter_id
  WHERE ps.year = target_year
  GROUP BY ps.id;
END; $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
insert into public.profiles (id, firstname, lastname)
  values (new.id, new.raw_user_meta_data->>'firstname', new.raw_user_meta_data->>'lastname');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_ok(presentation_presenters)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
   /* avoid recursion if the "user_id" is correct */
   IF ($1).presenter_id = uid() THEN
      RETURN TRUE;
   END IF;
   /* otherwise, recurse */
   RETURN EXISTS (SELECT 1 FROM presentation_presenters AS pp
                  WHERE ($1).presentation_id = pp.presentation_id AND pp.presenter_id = uid());
END;$function$
;

CREATE OR REPLACE FUNCTION public.is_ok(presentation_submissions)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$BEGIN
   /* avoid recursion if the "user_id" is correct */
   IF ($1).presenter_id = auth.uid() THEN
      RETURN TRUE;
   END IF;
   /* otherwise, recurse */
   RETURN EXISTS (SELECT 1 FROM presentation_submissions AS ps
                  WHERE ($1).presentation_id = ps.presentation_id 
                  AND ps.presenter_id = auth.uid());
END;$function$
;

CREATE OR REPLACE FUNCTION public.presenter_email_lookup(presentation_presenters)
 RETURNS SETOF email_lookup
 LANGUAGE sql
 STABLE ROWS 1
AS $function$
  SELECT * FROM email_lookup WHERE id = $1.presenter_id
$function$
;

CREATE OR REPLACE FUNCTION public.store_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
insert into public.email_lookup (id, email)
  values (new.id, new.email);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$function$
;



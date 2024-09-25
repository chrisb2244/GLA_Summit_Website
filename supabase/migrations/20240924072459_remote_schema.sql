CREATE INDEX refresh_token_session_id ON auth.refresh_tokens USING btree (session_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.email', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
	)::text
$function$
;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.role', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
	)::text
$function$
;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_emails AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION store_email();


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return split_part(_filename, '.', 2);
END
$function$
;

grant delete on table "storage"."s3_multipart_uploads" to "postgres";

grant insert on table "storage"."s3_multipart_uploads" to "postgres";

grant references on table "storage"."s3_multipart_uploads" to "postgres";

grant select on table "storage"."s3_multipart_uploads" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads" to "postgres";

grant update on table "storage"."s3_multipart_uploads" to "postgres";

grant delete on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant insert on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant references on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant select on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant trigger on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant truncate on table "storage"."s3_multipart_uploads_parts" to "postgres";

grant update on table "storage"."s3_multipart_uploads_parts" to "postgres";

create policy "Anyone can upload an avatar."
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'avatars'::text));


create policy "Avatar images are publicly accessible."
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));


create policy "Users can update or delete their own avatar 1oj01fe_0"
on "storage"."objects"
as permissive
for update
to public
using ((auth.uid() = owner));


create policy "Users can update or delete their own avatar 1oj01fe_1"
on "storage"."objects"
as permissive
for delete
to public
using ((auth.uid() = owner));



create sequence "public"."ticket_sequence_2024";

alter table "public"."email_lookup" drop constraint "email_lookup_id_fkey";

alter table "public"."log" drop constraint "log_user_id_fkey";

alter table "public"."organizers" drop constraint "organizers_id_fkey";

alter table "public"."timezone_preferences" drop constraint "timezone_preferences_id_fkey";

drop view if exists "public"."all_presentations";

drop view if exists "public"."my_submissions";

alter type "public"."summit_year" add value '2024';

create table "public"."confirmed_presentations" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."confirmed_presentations" enable row level security;

create table "public"."rejected_presentations" (
    "id" uuid not null
);


alter table "public"."rejected_presentations" enable row level security;

create table "public"."ticket_sequences" (
    "year" summit_year not null,
    "name" text
);


alter table "public"."ticket_sequences" enable row level security;

create table "public"."tickets" (
    "user_id" uuid not null,
    "ticket_number" numeric not null,
    "year" summit_year not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."tickets" enable row level security;

create table "public"."video_links" (
    "presentation_id" uuid not null,
    "url" text
);


alter table "public"."video_links" enable row level security;

alter table "public"."accepted_presentations" alter column year type "public"."summit_year" using year::text::"public"."summit_year";

alter table "public"."presentation_submissions" alter column year type "public"."summit_year" using year::text::"public"."summit_year";

CREATE UNIQUE INDEX confirmed_presentations_pkey ON public.confirmed_presentations USING btree (id);

CREATE UNIQUE INDEX rejected_presentations_pkey ON public.rejected_presentations USING btree (id);

CREATE UNIQUE INDEX ticket_sequences_pkey ON public.ticket_sequences USING btree (year);

CREATE UNIQUE INDEX tickets_pkey ON public.tickets USING btree (user_id, year);

CREATE UNIQUE INDEX tickets_year_ticket_number_key ON public.tickets USING btree (year, ticket_number);

CREATE UNIQUE INDEX video_links_pkey ON public.video_links USING btree (presentation_id);

alter table "public"."confirmed_presentations" add constraint "confirmed_presentations_pkey" PRIMARY KEY using index "confirmed_presentations_pkey";

alter table "public"."rejected_presentations" add constraint "rejected_presentations_pkey" PRIMARY KEY using index "rejected_presentations_pkey";

alter table "public"."ticket_sequences" add constraint "ticket_sequences_pkey" PRIMARY KEY using index "ticket_sequences_pkey";

alter table "public"."tickets" add constraint "tickets_pkey" PRIMARY KEY using index "tickets_pkey";

alter table "public"."video_links" add constraint "video_links_pkey" PRIMARY KEY using index "video_links_pkey";

alter table "public"."confirmed_presentations" add constraint "public_confirmed_presentations_id_fkey" FOREIGN KEY (id) REFERENCES accepted_presentations(id) not valid;

alter table "public"."confirmed_presentations" validate constraint "public_confirmed_presentations_id_fkey";

alter table "public"."email_lookup" add constraint "public_email_lookup_id_fkey" FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."email_lookup" validate constraint "public_email_lookup_id_fkey";

alter table "public"."log" add constraint "public_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."log" validate constraint "public_log_user_id_fkey";

alter table "public"."organizers" add constraint "public_organizers_id_fkey" FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."organizers" validate constraint "public_organizers_id_fkey";

alter table "public"."rejected_presentations" add constraint "public_rejected_presentations_id_fkey" FOREIGN KEY (id) REFERENCES presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."rejected_presentations" validate constraint "public_rejected_presentations_id_fkey";

alter table "public"."tickets" add constraint "public_tickets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."tickets" validate constraint "public_tickets_user_id_fkey";

alter table "public"."tickets" add constraint "public_tickets_year_fkey" FOREIGN KEY (year) REFERENCES ticket_sequences(year) not valid;

alter table "public"."tickets" validate constraint "public_tickets_year_fkey";

alter table "public"."tickets" add constraint "tickets_year_ticket_number_key" UNIQUE using index "tickets_year_ticket_number_key";

alter table "public"."timezone_preferences" add constraint "public_timezone_preferences_id_fkey" FOREIGN KEY (id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."timezone_preferences" validate constraint "public_timezone_preferences_id_fkey";

alter table "public"."video_links" add constraint "video_links_presentation_id_fkey" FOREIGN KEY (presentation_id) REFERENCES presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."video_links" validate constraint "video_links_presentation_id_fkey";

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

DROP FUNCTION IF EXISTS public.get_all_presentations();

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

DROP FUNCTION IF EXISTS public.get_my_submissions();

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

create or replace view "public"."my_submissions" as  SELECT get_my_submissions.presentation_id,
    get_my_submissions.title,
    get_my_submissions.abstract,
    get_my_submissions.learning_points,
    get_my_submissions.presentation_type,
    get_my_submissions.submitter_id,
    get_my_submissions.is_submitted,
    get_my_submissions.year,
    get_my_submissions.all_presenters_ids,
    get_my_submissions.all_firstnames,
    get_my_submissions.all_lastnames,
    get_my_submissions.all_emails
   FROM get_my_submissions() get_my_submissions(presentation_id, title, abstract, learning_points, presentation_type, submitter_id, is_submitted, year, all_presenters_ids, all_firstnames, all_lastnames, all_emails);


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

create or replace view "public"."all_presentations" as  SELECT get_all_presentations.presentation_id,
    get_all_presentations.scheduled_for,
    get_all_presentations.year,
    get_all_presentations.title,
    get_all_presentations.abstract,
    get_all_presentations.presentation_type,
    get_all_presentations.primary_presenter,
    get_all_presentations.all_presenters,
    get_all_presentations.all_presenters_names,
    get_all_presentations.all_presenter_firstnames,
    get_all_presentations.all_presenter_lastnames
   FROM get_all_presentations() get_all_presentations(presentation_id, scheduled_for, year, title, abstract, presentation_type, primary_presenter, all_presenters, all_presenters_names, all_presenter_firstnames, all_presenter_lastnames);


grant delete on table "public"."confirmed_presentations" to "anon";

grant insert on table "public"."confirmed_presentations" to "anon";

grant references on table "public"."confirmed_presentations" to "anon";

grant select on table "public"."confirmed_presentations" to "anon";

grant trigger on table "public"."confirmed_presentations" to "anon";

grant truncate on table "public"."confirmed_presentations" to "anon";

grant update on table "public"."confirmed_presentations" to "anon";

grant delete on table "public"."confirmed_presentations" to "authenticated";

grant insert on table "public"."confirmed_presentations" to "authenticated";

grant references on table "public"."confirmed_presentations" to "authenticated";

grant select on table "public"."confirmed_presentations" to "authenticated";

grant trigger on table "public"."confirmed_presentations" to "authenticated";

grant truncate on table "public"."confirmed_presentations" to "authenticated";

grant update on table "public"."confirmed_presentations" to "authenticated";

grant delete on table "public"."confirmed_presentations" to "service_role";

grant insert on table "public"."confirmed_presentations" to "service_role";

grant references on table "public"."confirmed_presentations" to "service_role";

grant select on table "public"."confirmed_presentations" to "service_role";

grant trigger on table "public"."confirmed_presentations" to "service_role";

grant truncate on table "public"."confirmed_presentations" to "service_role";

grant update on table "public"."confirmed_presentations" to "service_role";

grant delete on table "public"."rejected_presentations" to "anon";

grant insert on table "public"."rejected_presentations" to "anon";

grant references on table "public"."rejected_presentations" to "anon";

grant select on table "public"."rejected_presentations" to "anon";

grant trigger on table "public"."rejected_presentations" to "anon";

grant truncate on table "public"."rejected_presentations" to "anon";

grant update on table "public"."rejected_presentations" to "anon";

grant delete on table "public"."rejected_presentations" to "authenticated";

grant insert on table "public"."rejected_presentations" to "authenticated";

grant references on table "public"."rejected_presentations" to "authenticated";

grant select on table "public"."rejected_presentations" to "authenticated";

grant trigger on table "public"."rejected_presentations" to "authenticated";

grant truncate on table "public"."rejected_presentations" to "authenticated";

grant update on table "public"."rejected_presentations" to "authenticated";

grant delete on table "public"."rejected_presentations" to "service_role";

grant insert on table "public"."rejected_presentations" to "service_role";

grant references on table "public"."rejected_presentations" to "service_role";

grant select on table "public"."rejected_presentations" to "service_role";

grant trigger on table "public"."rejected_presentations" to "service_role";

grant truncate on table "public"."rejected_presentations" to "service_role";

grant update on table "public"."rejected_presentations" to "service_role";

grant delete on table "public"."ticket_sequences" to "anon";

grant insert on table "public"."ticket_sequences" to "anon";

grant references on table "public"."ticket_sequences" to "anon";

grant select on table "public"."ticket_sequences" to "anon";

grant trigger on table "public"."ticket_sequences" to "anon";

grant truncate on table "public"."ticket_sequences" to "anon";

grant update on table "public"."ticket_sequences" to "anon";

grant delete on table "public"."ticket_sequences" to "authenticated";

grant insert on table "public"."ticket_sequences" to "authenticated";

grant references on table "public"."ticket_sequences" to "authenticated";

grant select on table "public"."ticket_sequences" to "authenticated";

grant trigger on table "public"."ticket_sequences" to "authenticated";

grant truncate on table "public"."ticket_sequences" to "authenticated";

grant update on table "public"."ticket_sequences" to "authenticated";

grant delete on table "public"."ticket_sequences" to "service_role";

grant insert on table "public"."ticket_sequences" to "service_role";

grant references on table "public"."ticket_sequences" to "service_role";

grant select on table "public"."ticket_sequences" to "service_role";

grant trigger on table "public"."ticket_sequences" to "service_role";

grant truncate on table "public"."ticket_sequences" to "service_role";

grant update on table "public"."ticket_sequences" to "service_role";

grant delete on table "public"."tickets" to "anon";

grant insert on table "public"."tickets" to "anon";

grant references on table "public"."tickets" to "anon";

grant select on table "public"."tickets" to "anon";

grant trigger on table "public"."tickets" to "anon";

grant truncate on table "public"."tickets" to "anon";

grant update on table "public"."tickets" to "anon";

grant delete on table "public"."tickets" to "authenticated";

grant insert on table "public"."tickets" to "authenticated";

grant references on table "public"."tickets" to "authenticated";

grant select on table "public"."tickets" to "authenticated";

grant trigger on table "public"."tickets" to "authenticated";

grant truncate on table "public"."tickets" to "authenticated";

grant update on table "public"."tickets" to "authenticated";

grant delete on table "public"."tickets" to "service_role";

grant insert on table "public"."tickets" to "service_role";

grant references on table "public"."tickets" to "service_role";

grant select on table "public"."tickets" to "service_role";

grant trigger on table "public"."tickets" to "service_role";

grant truncate on table "public"."tickets" to "service_role";

grant update on table "public"."tickets" to "service_role";

grant delete on table "public"."video_links" to "anon";

grant insert on table "public"."video_links" to "anon";

grant references on table "public"."video_links" to "anon";

grant select on table "public"."video_links" to "anon";

grant trigger on table "public"."video_links" to "anon";

grant truncate on table "public"."video_links" to "anon";

grant update on table "public"."video_links" to "anon";

grant delete on table "public"."video_links" to "authenticated";

grant insert on table "public"."video_links" to "authenticated";

grant references on table "public"."video_links" to "authenticated";

grant select on table "public"."video_links" to "authenticated";

grant trigger on table "public"."video_links" to "authenticated";

grant truncate on table "public"."video_links" to "authenticated";

grant update on table "public"."video_links" to "authenticated";

grant delete on table "public"."video_links" to "service_role";

grant insert on table "public"."video_links" to "service_role";

grant references on table "public"."video_links" to "service_role";

grant select on table "public"."video_links" to "service_role";

grant trigger on table "public"."video_links" to "service_role";

grant truncate on table "public"."video_links" to "service_role";

grant update on table "public"."video_links" to "service_role";

create policy "Insert presentations if authenticated (trigger blocks others)"
on "public"."confirmed_presentations"
as permissive
for insert
to authenticated
with check (true);


create policy "authenticated users can select"
on "public"."confirmed_presentations"
as permissive
for select
to authenticated
using (true);


create policy "Selection for insertion (submitter)"
on "public"."presentation_submissions"
as permissive
for select
to authenticated
using ((auth.uid() = submitter_id));


create policy "Allow selecting your own presentation"
on "public"."rejected_presentations"
as permissive
for select
to authenticated
using ((auth.uid() IN ( SELECT pp.presenter_id
   FROM presentation_presenters pp
  WHERE (pp.presentation_id = rejected_presentations.id))));


create policy "Insert own ticket"
on "public"."tickets"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Select own ticket"
on "public"."tickets"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Enable read access for all users"
on "public"."video_links"
as permissive
for select
to public
using (true);


CREATE TRIGGER block_confirming_others_presentations BEFORE INSERT ON public.confirmed_presentations FOR EACH ROW EXECUTE FUNCTION check_confirmer_is_submitter();

CREATE TRIGGER create_ticket_sequence_trigger BEFORE INSERT ON public.ticket_sequences FOR EACH ROW EXECUTE FUNCTION create_ticket_sequence();

CREATE TRIGGER calculate_ticket_number_trigger BEFORE INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION calculate_ticket_number();



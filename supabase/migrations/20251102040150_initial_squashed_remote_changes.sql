
CREATE OR REPLACE FUNCTION public.get_email_by_id(user_id uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
select email from auth.users where id=user_id
$function$;
REVOKE ALL ON FUNCTION public.get_email_by_id FROM public;
REVOKE ALL ON FUNCTION public.get_email_by_id FROM anon;
REVOKE ALL ON FUNCTION public.get_email_by_id FROM authenticated;
GRANT ALL ON FUNCTION public.get_email_by_id(user_id uuid) TO service_role;

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
  $function$;


CREATE OR REPLACE FUNCTION "public"."get_presentation_ids"() RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$$;

CREATE OR REPLACE FUNCTION "public"."get_presentation_ids"("p_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$$;

SET default_tablespace = '';
SET default_table_access_method = "heap";


CREATE OR REPLACE FUNCTION "public"."is_ok"("public"."presentation_presenters") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$BEGIN
   /* avoid recursion if the "user_id" is correct */
   IF ($1).presenter_id = uid() THEN
      RETURN TRUE;
   END IF;
   /* otherwise, recurse */
   RETURN EXISTS (SELECT 1 FROM presentation_presenters AS pp
                  WHERE ($1).presentation_id = pp.presentation_id AND pp.presenter_id = uid());
END;$_$;



CREATE OR REPLACE FUNCTION "public"."is_ok"("public"."presentation_submissions") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $_$BEGIN
   /* avoid recursion if the "user_id" is correct */
   IF ($1).presenter_id = auth.uid() THEN
      RETURN TRUE;
   END IF;
   /* otherwise, recurse */
   RETURN EXISTS (SELECT 1 FROM presentation_submissions AS ps
                  WHERE ($1).presentation_id = ps.presentation_id 
                  AND ps.presenter_id = auth.uid());
END;$_$;


CREATE TABLE IF NOT EXISTS public.agenda_favourites (
  user_id uuid NOT NULL,
  presentation_id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT "now"() NOT NULL,
  PRIMARY KEY (user_id, presentation_id)
);
ALTER TABLE public.agenda_favourites ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.container_groups (
  container_id uuid NOT NULL,
  presentation_id uuid NOT NULL,
  PRIMARY KEY (container_id, presentation_id)
);
ALTER TABLE public.container_groups ENABLE ROW LEVEL SECURITY;



CREATE OR REPLACE VIEW "public"."my_submissions" AS
 SELECT "get_my_submissions"."presentation_id",
    "get_my_submissions"."title",
    "get_my_submissions"."abstract",
    "get_my_submissions"."learning_points",
    "get_my_submissions"."presentation_type",
    "get_my_submissions"."submitter_id",
    "get_my_submissions"."is_submitted",
    "get_my_submissions"."year",
    "get_my_submissions"."all_presenters_ids",
    "get_my_submissions"."all_firstnames",
    "get_my_submissions"."all_lastnames",
    "get_my_submissions"."all_emails"
   FROM "public"."get_my_submissions"() "get_my_submissions"("presentation_id", "title", "abstract", "learning_points", "presentation_type", "submitter_id", "is_submitted", "year", "all_presenters_ids", "all_firstnames", "all_lastnames", "all_emails");


ALTER TABLE ONLY "public"."agenda_favourites"
    ADD CONSTRAINT "agenda_favourites_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id");
ALTER TABLE ONLY "public"."agenda_favourites"
    ADD CONSTRAINT "agenda_favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."container_groups"
    ADD CONSTRAINT "container_groups_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "public"."presentation_submissions"("id");
ALTER TABLE ONLY "public"."container_groups"
    ADD CONSTRAINT "container_groups_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id");
CREATE POLICY "Container groups are viewable" ON "public"."container_groups" FOR SELECT USING (true);
CREATE POLICY "Submissions are viewable if containers" ON "public"."presentation_submissions" FOR SELECT USING (("id" IN ( SELECT "container_groups"."container_id"
   FROM "public"."container_groups")));
CREATE POLICY "User can modify their own favourites" ON "public"."agenda_favourites" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

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
$function$;

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

drop view if exists "public"."my_submissions";

create table "public"."confirmed_presentations" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."confirmed_presentations" enable row level security;

create table "public"."video_links" (
    "presentation_id" uuid not null,
    "url" text
);
alter table "public"."video_links" enable row level security;
CREATE UNIQUE INDEX confirmed_presentations_pkey ON public.confirmed_presentations USING btree (id);

CREATE UNIQUE INDEX video_links_pkey ON public.video_links USING btree (presentation_id);
alter table "public"."confirmed_presentations" add constraint "confirmed_presentations_pkey" PRIMARY KEY using index "confirmed_presentations_pkey";

alter table "public"."video_links" add constraint "video_links_pkey" PRIMARY KEY using index "video_links_pkey";
alter table "public"."confirmed_presentations" add constraint "public_confirmed_presentations_id_fkey" FOREIGN KEY (id) REFERENCES accepted_presentations(id) not valid;
alter table "public"."confirmed_presentations" validate constraint "public_confirmed_presentations_id_fkey";
alter table "public"."video_links" add constraint "video_links_presentation_id_fkey" FOREIGN KEY (presentation_id) REFERENCES presentation_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."video_links" validate constraint "video_links_presentation_id_fkey";
set check_function_bodies = off;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_email_by_id(user_id uuid)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'auth'
AS $function$
select email from auth.users where id=user_id
$function$;

CREATE OR REPLACE FUNCTION public.get_presentation_ids()
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$function$;
CREATE OR REPLACE FUNCTION public.get_presentation_ids(p_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$function$;

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
END;$function$;
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
END;$function$;
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

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$function$;

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
create policy "Enable read access for all users"
on "public"."video_links"
as permissive
for select
to public
using (true);
CREATE TRIGGER block_confirming_others_presentations BEFORE INSERT ON public.confirmed_presentations FOR EACH ROW EXECUTE FUNCTION check_confirmer_is_submitter();


set check_function_bodies = off;

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
$function$;


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

  $function$;
CREATE OR REPLACE FUNCTION public.get_presentation_ids()
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$function$;
CREATE OR REPLACE FUNCTION public.get_presentation_ids(p_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$function$;

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
END;$function$;
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
END;$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$function$;

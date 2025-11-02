CREATE TYPE public.log_type AS ENUM (
    'info',
    'error',
    'severe'
);
CREATE TYPE public.mentoring_type AS ENUM (
    'mentor',
    'mentee'
);
CREATE TYPE public.presentation_type AS ENUM (
    '7x7',
    'full length',
    'panel',
    '15 minutes',
    'quiz',
    'session-container'
);
CREATE TYPE public.presenter_info AS (
	id uuid,
	firstname text,
	lastname text
);
CREATE TYPE public.summit_year AS ENUM (
    '2020',
    '2021',
    '2022',
    '2024',
    '2025'
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    avatar_url text,
    website text,
    bio text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.public_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.presentation_submissions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    submitter_id uuid NOT NULL REFERENCES public.profiles(id),
    updated_at timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    title text NOT NULL,
    abstract text NOT NULL,
    is_submitted boolean NOT NULL,
    presentation_type public.presentation_type NOT NULL,
    learning_points text,
    year public.summit_year NOT NULL
);
ALTER TABLE public.presentation_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.accepted_presentations (
    id uuid PRIMARY KEY REFERENCES public.presentation_submissions(id),
    accepted_at timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    scheduled_for timestamp with time zone,
    year public.summit_year NOT NULL
);

CREATE TABLE IF NOT EXISTS public.presentation_presenters (
    presentation_id uuid NOT NULL REFERENCES public.presentation_submissions(id) ON DELETE CASCADE,
    presenter_id uuid NOT NULL REFERENCES public.profiles(id),
    PRIMARY KEY (presentation_id, presenter_id)
);

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
  $function$;

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

CREATE OR REPLACE FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") RETURNS TABLE("presentation_id" "uuid", "title" "text", "abstract" "text", "presentation_type" "public"."presentation_type", "learning_points" "text", "submitter_id" "uuid", "presenters" "public"."presenter_info"[], "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
END; $$;
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
insert into public.profiles (id, firstname, lastname)
  values (new.id, new.raw_user_meta_data->>'firstname', new.raw_user_meta_data->>'lastname');
  return new;
end;
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

CREATE TABLE IF NOT EXISTS "public"."email_lookup" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL
);

CREATE OR REPLACE FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") RETURNS SETOF "public"."email_lookup"
    LANGUAGE "sql" STABLE ROWS 1
    AS $_$
  SELECT * FROM email_lookup WHERE id = $1.presenter_id
$_$;

CREATE OR REPLACE FUNCTION "public"."store_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
insert into public.email_lookup (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$$;



CREATE TABLE IF NOT EXISTS "public"."agenda_favourites" (
    "user_id" "uuid" NOT NULL,
    "presentation_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE OR REPLACE VIEW "public"."all_presentations" AS
 SELECT "gap"."presentation_id",
    "gap"."scheduled_for",
    "gap"."year",
    "gap"."title",
    "gap"."abstract",
    "gap"."presentation_type",
    "gap"."primary_presenter",
    "gap"."all_presenters",
    "gap"."all_presenters_names",
    "gap"."all_presenter_firstnames",
    "gap"."all_presenter_lastnames"
   FROM "public"."get_all_presentations"() "gap"("presentation_id", "scheduled_for", "year", "title", "abstract", "presentation_type", "primary_presenter", "all_presenters", "all_presenters_names", "all_presenter_firstnames", "all_presenter_lastnames");

CREATE TABLE IF NOT EXISTS "public"."container_groups" (
    "container_id" "uuid" NOT NULL,
    "presentation_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."log" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "severity" "public"."log_type" NOT NULL,
    "message" "text" NOT NULL,
    "user_id" "uuid"
);

ALTER TABLE "public"."log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
CREATE TABLE IF NOT EXISTS "public"."log_viewers" (
    "user_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."mentoring" (
    "email" "text" NOT NULL,
    "firstname" "text" NOT NULL,
    "lastname" "text" NOT NULL,
    "entry_type" "public"."mentoring_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

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

CREATE TABLE IF NOT EXISTS "public"."organizers" (
    "id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."timezone_preferences" (
    "id" "uuid" NOT NULL,
    "timezone_db" "text" NOT NULL,
    "timezone_name" "text" NOT NULL,
    "use_24h_clock" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."agenda_favourites"
    ADD CONSTRAINT "agenda_favourites_pkey" PRIMARY KEY ("user_id", "presentation_id");
ALTER TABLE ONLY "public"."container_groups"
    ADD CONSTRAINT "container_groups_pkey" PRIMARY KEY ("container_id", "presentation_id");
ALTER TABLE ONLY "public"."email_lookup"
    ADD CONSTRAINT "email_lookup_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."log_viewers"
    ADD CONSTRAINT "log_viewers_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."log_viewers"
    ADD CONSTRAINT "log_viewers_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."mentoring"
    ADD CONSTRAINT "mentoring_pkey" PRIMARY KEY ("email");
ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."timezone_preferences"
    ADD CONSTRAINT "timezone_preferences_pkey" PRIMARY KEY ("id");
CREATE OR REPLACE TRIGGER "update_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();
ALTER TABLE ONLY "public"."agenda_favourites"
    ADD CONSTRAINT "agenda_favourites_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id");
ALTER TABLE ONLY "public"."agenda_favourites"
    ADD CONSTRAINT "agenda_favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."container_groups"
    ADD CONSTRAINT "container_groups_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "public"."presentation_submissions"("id");
ALTER TABLE ONLY "public"."container_groups"
    ADD CONSTRAINT "container_groups_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id");
ALTER TABLE ONLY "public"."email_lookup"
    ADD CONSTRAINT "email_lookup_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."log"
    ADD CONSTRAINT "log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."log_viewers"
    ADD CONSTRAINT "log_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."timezone_preferences"
    ADD CONSTRAINT "timezone_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");
CREATE POLICY "Accepted presenters profiles are viewable" ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "pp"."presenter_id"
   FROM ("public"."accepted_presentations"
     LEFT JOIN "public"."presentation_presenters" "pp" ON (("pp"."presentation_id" = "accepted_presentations"."id"))))));
CREATE POLICY "Anyone can register if email not in profiles" ON "public"."mentoring" FOR INSERT WITH CHECK ((NOT ("email" IN ( SELECT "mentoring"."email"
   FROM "public"."profiles"))));
CREATE POLICY "Container groups are viewable" ON "public"."container_groups" FOR SELECT USING (true);
CREATE POLICY "Everyone can select public profiles." ON "public"."public_profiles" FOR SELECT USING (true);
CREATE POLICY "List presenters if presentation accepted" ON "public"."presentation_presenters" FOR SELECT USING (("presentation_id" IN ( SELECT "accepted_presentations"."id"
   FROM "public"."accepted_presentations")));
CREATE POLICY "Logged in users can register their own email" ON "public"."mentoring" FOR INSERT TO "authenticated" WITH CHECK (("email" IN ( SELECT "mentoring"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
CREATE POLICY "Organizers can check their existence." ON "public"."organizers" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
CREATE POLICY "Organizers can query table" ON "public"."presentation_presenters" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "organizers"."id"
   FROM "public"."organizers")));
CREATE POLICY "Organizers can select submitted presentations" ON "public"."presentation_submissions" FOR SELECT TO "authenticated" USING ((("is_submitted" = true) AND ("auth"."uid"() IN ( SELECT "organizers"."id"
   FROM "public"."organizers"))));
CREATE POLICY "Organizers can view profiles of presentation submitters" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" IN ( SELECT "presentation_presenters"."presenter_id"
   FROM "public"."presentation_presenters")) AND ("auth"."uid"() IN ( SELECT "organizers"."id"
   FROM "public"."organizers"))));
CREATE POLICY "Presenters and co-presenters can select" ON "public"."presentation_submissions" FOR SELECT USING (("auth"."uid"() IN ( SELECT "pp"."presenter_id"
   FROM "public"."presentation_presenters" "pp"
  WHERE ("pp"."presentation_id" = "presentation_submissions"."id"))));
CREATE POLICY "Presenters can find their own entries" ON "public"."presentation_presenters" FOR SELECT TO "authenticated" USING (("presenter_id" = "auth"."uid"()));
CREATE POLICY "Profiles listed as public are viewable by everyone." ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "public_profiles"."id"
   FROM "public"."public_profiles")));
CREATE POLICY "Select yourself" ON "public"."log_viewers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
CREATE POLICY "Specified users (log_viewers) can access the logs" ON "public"."log" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "log_viewers"."user_id"
   FROM "public"."log_viewers")));
CREATE POLICY "Submissions are viewable if accepted" ON "public"."presentation_submissions" FOR SELECT USING (("id" IN ( SELECT "accepted_presentations"."id"
   FROM "public"."accepted_presentations")));
CREATE POLICY "Submissions are viewable if containers" ON "public"."presentation_submissions" FOR SELECT USING (("id" IN ( SELECT "container_groups"."container_id"
   FROM "public"."container_groups")));
CREATE POLICY "User can modify their own favourites" ON "public"."agenda_favourites" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "Users can delete draft presentations" ON "public"."presentation_submissions" FOR DELETE USING ((("auth"."uid"() = "submitter_id") AND ("is_submitted" = false)));
CREATE POLICY "Users can insert their own presentation submissions." ON "public"."presentation_submissions" FOR INSERT WITH CHECK (("auth"."uid"() = "submitter_id"));
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Users can modify their timezone preferences" ON "public"."timezone_preferences" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Users can read their own status" ON "public"."mentoring" FOR SELECT USING (("email" IN ( SELECT "mentoring"."email"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
CREATE POLICY "Users can select their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Users can update own presentation submissions." ON "public"."presentation_submissions" FOR UPDATE USING ((("auth"."uid"() = "submitter_id") AND ("is_submitted" = false)));
CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));
ALTER TABLE "public"."accepted_presentations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accepted_presentations are viewable" ON "public"."accepted_presentations" FOR SELECT USING (true);
ALTER TABLE "public"."agenda_favourites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."container_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_lookup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."log_viewers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mentoring" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."presentation_presenters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."timezone_preferences" ENABLE ROW LEVEL SECURITY;

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
$function$;
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
$function$;
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
END; $function$;
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
CREATE OR REPLACE FUNCTION public.presenter_email_lookup(presentation_presenters)
 RETURNS SETOF email_lookup
 LANGUAGE sql
 STABLE ROWS 1
AS $function$
  SELECT * FROM email_lookup WHERE id = $1.presenter_id
$function$;
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
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$function$;
create or replace view "public"."all_presentations" as SELECT
    gap.presentation_id,
    gap.scheduled_for,
    gap.year,
    gap.title,
    gap.abstract,
    gap.presentation_type,
    gap.primary_presenter,
    gap.all_presenters,
    gap.all_presenters_names,
    gap.all_presenter_firstnames,
    gap.all_presenter_lastnames
   FROM get_all_presentations() gap(presentation_id, scheduled_for, year, title, abstract, presentation_type, primary_presenter, all_presenters, all_presenters_names, all_presenter_firstnames, all_presenter_lastnames);
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

set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.calculate_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.ticket_number := nextval('ticket_sequence_' || NEW.year);
  RETURN NEW;
end
$function$;
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
END; $function$;
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
CREATE OR REPLACE FUNCTION public.presenter_email_lookup(presentation_presenters)
 RETURNS SETOF email_lookup
 LANGUAGE sql
 STABLE ROWS 1
AS $function$
  SELECT * FROM email_lookup WHERE id = $1.presenter_id
$function$;
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
$function$;
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$function$;

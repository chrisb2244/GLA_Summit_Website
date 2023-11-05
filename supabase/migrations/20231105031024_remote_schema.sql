
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER SCHEMA "public" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."log_type" AS ENUM (
    'info',
    'error',
    'severe'
);

ALTER TYPE "public"."log_type" OWNER TO "postgres";

CREATE TYPE "public"."mentoring_type" AS ENUM (
    'mentor',
    'mentee'
);

ALTER TYPE "public"."mentoring_type" OWNER TO "postgres";

CREATE TYPE "public"."presentation_type" AS ENUM (
    '7x7',
    'full length',
    'panel',
    '15 minutes',
    'quiz',
    'session-container'
);

ALTER TYPE "public"."presentation_type" OWNER TO "postgres";

CREATE TYPE "public"."presenter_info" AS (
	"id" "uuid",
	"firstname" "text",
	"lastname" "text"
);

ALTER TYPE "public"."presenter_info" OWNER TO "postgres";

CREATE TYPE "public"."summit_year" AS ENUM (
    '2020',
    '2021',
    '2022',
    '2023'
);

ALTER TYPE "public"."summit_year" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_all_presentations"() RETURNS TABLE("presentation_id" "uuid", "scheduled_for" timestamp with time zone, "year" "public"."summit_year", "title" "text", "abstract" "text", "presentation_type" "public"."presentation_type", "primary_presenter" "uuid", "all_presenters" "uuid"[], "all_presenters_names" "text"[], "all_presenter_firstnames" "text"[], "all_presenter_lastnames" "text"[])
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$

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
  
  $$;

ALTER FUNCTION "public"."get_all_presentations"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_email_by_id"("user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'auth'
    AS $$
select email from auth.users where id=user_id
$$;

ALTER FUNCTION "public"."get_email_by_id"("user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_my_submissions"() RETURNS TABLE("presentation_id" "uuid", "title" "text", "abstract" "text", "learning_points" "text", "presentation_type" "public"."presentation_type", "submitter_id" "uuid", "is_submitted" boolean, "year" "public"."summit_year", "all_presenters_ids" "uuid"[], "all_firstnames" "text"[], "all_lastnames" "text"[], "all_emails" "text"[])
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

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

  $$;

ALTER FUNCTION "public"."get_my_submissions"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_presentation_ids"() RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$$;

ALTER FUNCTION "public"."get_presentation_ids"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_presentation_ids"("p_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$$;

ALTER FUNCTION "public"."get_presentation_ids"("p_id" "uuid") OWNER TO "postgres";

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

ALTER FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") OWNER TO "postgres";

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

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."presentation_presenters" (
    "presentation_id" "uuid" NOT NULL,
    "presenter_id" "uuid" NOT NULL
);

ALTER TABLE "public"."presentation_presenters" OWNER TO "postgres";

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

ALTER FUNCTION "public"."is_ok"("public"."presentation_presenters") OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."presentation_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "submitter_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "title" "text" NOT NULL,
    "abstract" "text" NOT NULL,
    "is_submitted" boolean NOT NULL,
    "presentation_type" "public"."presentation_type" NOT NULL,
    "learning_points" "text",
    "year" "public"."summit_year" NOT NULL
);

ALTER TABLE "public"."presentation_submissions" OWNER TO "postgres";

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

ALTER FUNCTION "public"."is_ok"("public"."presentation_submissions") OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."email_lookup" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL
);

ALTER TABLE "public"."email_lookup" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") RETURNS SETOF "public"."email_lookup"
    LANGUAGE "sql" STABLE ROWS 1
    AS $_$
  SELECT * FROM email_lookup WHERE id = $1.presenter_id
$_$;

ALTER FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") OWNER TO "postgres";

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

ALTER FUNCTION "public"."store_email"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$$;

ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."accepted_presentations" (
    "id" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "scheduled_for" timestamp with time zone,
    "year" "public"."summit_year" NOT NULL
);

ALTER TABLE "public"."accepted_presentations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."agenda_favourites" (
    "user_id" "uuid" NOT NULL,
    "presentation_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."agenda_favourites" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."all_presentations" AS
 SELECT "get_all_presentations"."presentation_id",
    "get_all_presentations"."scheduled_for",
    "get_all_presentations"."year",
    "get_all_presentations"."title",
    "get_all_presentations"."abstract",
    "get_all_presentations"."presentation_type",
    "get_all_presentations"."primary_presenter",
    "get_all_presentations"."all_presenters",
    "get_all_presentations"."all_presenters_names",
    "get_all_presentations"."all_presenter_firstnames",
    "get_all_presentations"."all_presenter_lastnames"
   FROM "public"."get_all_presentations"() "get_all_presentations"("presentation_id", "scheduled_for", "year", "title", "abstract", "presentation_type", "primary_presenter", "all_presenters", "all_presenters_names", "all_presenter_firstnames", "all_presenter_lastnames");

ALTER TABLE "public"."all_presentations" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."container_groups" (
    "container_id" "uuid" NOT NULL,
    "presentation_id" "uuid" NOT NULL
);

ALTER TABLE "public"."container_groups" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."log" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "severity" "public"."log_type" NOT NULL,
    "message" "text" NOT NULL,
    "user_id" "uuid"
);

ALTER TABLE "public"."log" OWNER TO "postgres";

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

ALTER TABLE "public"."log_viewers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."mentoring" (
    "email" "text" NOT NULL,
    "firstname" "text" NOT NULL,
    "lastname" "text" NOT NULL,
    "entry_type" "public"."mentoring_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."mentoring" OWNER TO "postgres";

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

ALTER TABLE "public"."my_submissions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."organizers" (
    "id" "uuid" NOT NULL
);

ALTER TABLE "public"."organizers" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "firstname" "text" NOT NULL,
    "lastname" "text" NOT NULL,
    "avatar_url" "text",
    "website" "text",
    "bio" "text"
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."public_profiles" (
    "id" "uuid" NOT NULL
);

ALTER TABLE "public"."public_profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."timezone_preferences" (
    "id" "uuid" NOT NULL,
    "timezone_db" "text" NOT NULL,
    "timezone_name" "text" NOT NULL,
    "use_24h_clock" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."timezone_preferences" OWNER TO "postgres";

ALTER TABLE ONLY "public"."accepted_presentations"
    ADD CONSTRAINT "accepted_presentations_pkey" PRIMARY KEY ("id");

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

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_pkey" PRIMARY KEY ("presentation_id", "presenter_id");

ALTER TABLE ONLY "public"."presentation_submissions"
    ADD CONSTRAINT "presentation_submissions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."public_profiles"
    ADD CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."timezone_preferences"
    ADD CONSTRAINT "timezone_preferences_pkey" PRIMARY KEY ("id");

CREATE OR REPLACE TRIGGER "update_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

ALTER TABLE ONLY "public"."accepted_presentations"
    ADD CONSTRAINT "accepted_presentations_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."presentation_submissions"("id");

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

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "public"."profiles"("id");

ALTER TABLE ONLY "public"."presentation_submissions"
    ADD CONSTRAINT "presentation_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "public"."profiles"("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."public_profiles"
    ADD CONSTRAINT "public_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id");

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

ALTER TABLE "public"."presentation_submissions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."public_profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."timezone_preferences" ENABLE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") TO "anon";
GRANT ALL ON FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON TABLE "public"."presentation_presenters" TO "anon";
GRANT ALL ON TABLE "public"."presentation_presenters" TO "authenticated";
GRANT ALL ON TABLE "public"."presentation_presenters" TO "service_role";

GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "service_role";

GRANT ALL ON TABLE "public"."presentation_submissions" TO "anon";
GRANT ALL ON TABLE "public"."presentation_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."presentation_submissions" TO "service_role";

GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "service_role";

GRANT ALL ON TABLE "public"."email_lookup" TO "anon";
GRANT ALL ON TABLE "public"."email_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."email_lookup" TO "service_role";

GRANT ALL ON FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") TO "anon";
GRANT ALL ON FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") TO "authenticated";
GRANT ALL ON FUNCTION "public"."presenter_email_lookup"("public"."presentation_presenters") TO "service_role";

GRANT ALL ON FUNCTION "public"."store_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."store_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."store_email"() TO "service_role";

GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";

GRANT ALL ON TABLE "public"."accepted_presentations" TO "anon";
GRANT ALL ON TABLE "public"."accepted_presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."accepted_presentations" TO "service_role";

GRANT ALL ON TABLE "public"."agenda_favourites" TO "anon";
GRANT ALL ON TABLE "public"."agenda_favourites" TO "authenticated";
GRANT ALL ON TABLE "public"."agenda_favourites" TO "service_role";

GRANT ALL ON TABLE "public"."all_presentations" TO "anon";
GRANT ALL ON TABLE "public"."all_presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."all_presentations" TO "service_role";

GRANT ALL ON TABLE "public"."container_groups" TO "anon";
GRANT ALL ON TABLE "public"."container_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."container_groups" TO "service_role";

GRANT ALL ON TABLE "public"."log" TO "anon";
GRANT ALL ON TABLE "public"."log" TO "authenticated";
GRANT ALL ON TABLE "public"."log" TO "service_role";

GRANT ALL ON SEQUENCE "public"."log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."log_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."log_viewers" TO "anon";
GRANT ALL ON TABLE "public"."log_viewers" TO "authenticated";
GRANT ALL ON TABLE "public"."log_viewers" TO "service_role";

GRANT ALL ON TABLE "public"."mentoring" TO "anon";
GRANT ALL ON TABLE "public"."mentoring" TO "authenticated";
GRANT ALL ON TABLE "public"."mentoring" TO "service_role";

GRANT ALL ON TABLE "public"."my_submissions" TO "anon";
GRANT ALL ON TABLE "public"."my_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."my_submissions" TO "service_role";

GRANT ALL ON TABLE "public"."organizers" TO "anon";
GRANT ALL ON TABLE "public"."organizers" TO "authenticated";
GRANT ALL ON TABLE "public"."organizers" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."public_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."timezone_preferences" TO "anon";
GRANT ALL ON TABLE "public"."timezone_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."timezone_preferences" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;

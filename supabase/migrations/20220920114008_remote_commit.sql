--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1
-- Dumped by pg_dump version 14.5 (Debian 14.5-1.pgdg110+1)

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

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: presentation_type; Type: TYPE; Schema: public; Owner: supabase_admin
--

CREATE TYPE "public"."presentation_type" AS ENUM (
    '7x7',
    'full length',
    'panel',
    '15 minutes'
);


ALTER TYPE "public"."presentation_type" OWNER TO "supabase_admin";

--
-- Name: get_all_presentations(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."get_all_presentations"() RETURNS TABLE("presentation_id" "uuid", "scheduled_for" timestamp with time zone, "title" "text", "abstract" "text", "presentation_type" "public"."presentation_type", "primary_presenter" "uuid", "all_presenters" "uuid"[], "all_presenters_names" "text"[])
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$

select
  ap.id as presentation_id,
  scheduled_for,
  p.title,
  p.abstract,
  p.presentation_type,
  p.submitter_id as primary_presenter,
  p.all_presenters,
  p.all_presenters_names
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
      array_agg(coalesce(trim(coalesce(ppn.firstname, '') || ' ' || coalesce(ppn.lastname, '')), '')) as all_presenters_names
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


ALTER FUNCTION "public"."get_all_presentations"() OWNER TO "supabase_admin";

--
-- Name: get_email_by_id("uuid"); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."get_email_by_id"("user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'auth'
    AS $$
select email from auth.users where id=user_id
$$;


ALTER FUNCTION "public"."get_email_by_id"("user_id" "uuid") OWNER TO "supabase_admin";

--
-- Name: get_my_submissions(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."get_my_submissions"() RETURNS TABLE("presentation_id" "uuid", "title" "text", "abstract" "text", "learning_points" "text", "presentation_type" "public"."presentation_type", "submitter_id" "uuid", "is_submitted" boolean, "all_presenters_ids" "uuid"[], "all_firstnames" "text"[], "all_lastnames" "text"[], "all_emails" "text"[])
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


ALTER FUNCTION "public"."get_my_submissions"() OWNER TO "supabase_admin";

--
-- Name: get_presentation_ids(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."get_presentation_ids"() RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=auth.uid() group by presenter_id
$$;


ALTER FUNCTION "public"."get_presentation_ids"() OWNER TO "supabase_admin";

--
-- Name: get_presentation_ids("uuid"); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."get_presentation_ids"("p_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
select array_agg(presentation_id) presentations from presentation_presenters where presenter_id=p_id group by presenter_id
$$;


ALTER FUNCTION "public"."get_presentation_ids"("p_id" "uuid") OWNER TO "supabase_admin";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
insert into public.profiles (id, firstname, lastname)
  values (new.id, new.raw_user_meta_data->>'firstname', new.raw_user_meta_data->>'lastname');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: presentation_presenters; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."presentation_presenters" (
    "presentation_id" "uuid" NOT NULL,
    "presenter_id" "uuid" NOT NULL
);


ALTER TABLE "public"."presentation_presenters" OWNER TO "supabase_admin";

--
-- Name: is_ok("public"."presentation_presenters"); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."is_ok"("public"."presentation_presenters") RETURNS boolean
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


ALTER FUNCTION "public"."is_ok"("public"."presentation_presenters") OWNER TO "supabase_admin";

--
-- Name: presentation_submissions; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."presentation_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "submitter_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "title" "text",
    "abstract" "text",
    "is_submitted" boolean,
    "presentation_type" "public"."presentation_type",
    "learning_points" "text"
);


ALTER TABLE "public"."presentation_submissions" OWNER TO "supabase_admin";

--
-- Name: is_ok("public"."presentation_submissions"); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."is_ok"("public"."presentation_submissions") RETURNS boolean
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


ALTER FUNCTION "public"."is_ok"("public"."presentation_submissions") OWNER TO "supabase_admin";

--
-- Name: store_email(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."store_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
insert into public.email_lookup (id, email)
  values (new.id, new.email);
  return new;
end;
$$;


ALTER FUNCTION "public"."store_email"() OWNER TO "supabase_admin";

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: supabase_admin
--

CREATE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  NEW.updated_at = (now() at time zone 'utc');
  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "supabase_admin";

--
-- Name: accepted_presentations; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."accepted_presentations" (
    "id" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone NOT NULL,
    "scheduled_for" timestamp with time zone
);


ALTER TABLE "public"."accepted_presentations" OWNER TO "supabase_admin";

--
-- Name: all_presentations; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW "public"."all_presentations" AS
 SELECT "get_all_presentations"."presentation_id",
    "get_all_presentations"."scheduled_for",
    "get_all_presentations"."title",
    "get_all_presentations"."abstract",
    "get_all_presentations"."presentation_type",
    "get_all_presentations"."primary_presenter",
    "get_all_presentations"."all_presenters",
    "get_all_presentations"."all_presenters_names"
   FROM "public"."get_all_presentations"() "get_all_presentations"("presentation_id", "scheduled_for", "title", "abstract", "presentation_type", "primary_presenter", "all_presenters", "all_presenters_names");


ALTER TABLE "public"."all_presentations" OWNER TO "supabase_admin";

--
-- Name: email_lookup; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."email_lookup" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."email_lookup" OWNER TO "supabase_admin";

--
-- Name: my_submissions; Type: VIEW; Schema: public; Owner: supabase_admin
--

CREATE VIEW "public"."my_submissions" AS
 SELECT "get_my_submissions"."presentation_id",
    "get_my_submissions"."title",
    "get_my_submissions"."abstract",
    "get_my_submissions"."learning_points",
    "get_my_submissions"."presentation_type",
    "get_my_submissions"."submitter_id",
    "get_my_submissions"."is_submitted",
    "get_my_submissions"."all_presenters_ids",
    "get_my_submissions"."all_firstnames",
    "get_my_submissions"."all_lastnames",
    "get_my_submissions"."all_emails"
   FROM "public"."get_my_submissions"() "get_my_submissions"("presentation_id", "title", "abstract", "learning_points", "presentation_type", "submitter_id", "is_submitted", "all_presenters_ids", "all_firstnames", "all_lastnames", "all_emails");


ALTER TABLE "public"."my_submissions" OWNER TO "supabase_admin";

--
-- Name: organizers; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."organizers" (
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."organizers" OWNER TO "supabase_admin";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    "firstname" "text",
    "lastname" "text",
    "avatar_url" "text",
    "website" "text",
    "bio" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "supabase_admin";

--
-- Name: public_profiles; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."public_profiles" (
    "id" "uuid" NOT NULL
);


ALTER TABLE "public"."public_profiles" OWNER TO "supabase_admin";

--
-- Name: timezone_preferences; Type: TABLE; Schema: public; Owner: supabase_admin
--

CREATE TABLE "public"."timezone_preferences" (
    "id" "uuid" NOT NULL,
    "timezone_db" "text" NOT NULL,
    "timezone_name" "text" NOT NULL,
    "use_24h_clock" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."timezone_preferences" OWNER TO "supabase_admin";

--
-- Name: accepted_presentations accepted_presentations_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."accepted_presentations"
    ADD CONSTRAINT "accepted_presentations_pkey" PRIMARY KEY ("id");


--
-- Name: email_lookup email_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."email_lookup"
    ADD CONSTRAINT "email_lookup_pkey" PRIMARY KEY ("id");


--
-- Name: organizers organizers_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizers_pkey" PRIMARY KEY ("id");


--
-- Name: presentation_presenters presentation_presenters_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_pkey" PRIMARY KEY ("presentation_id", "presenter_id");


--
-- Name: presentation_submissions presentation_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."presentation_submissions"
    ADD CONSTRAINT "presentation_submissions_pkey" PRIMARY KEY ("id");


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");


--
-- Name: public_profiles public_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."public_profiles"
    ADD CONSTRAINT "public_profiles_pkey" PRIMARY KEY ("id");


--
-- Name: timezone_preferences timezone_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."timezone_preferences"
    ADD CONSTRAINT "timezone_preferences_pkey" PRIMARY KEY ("id");


--
-- Name: profiles update_profile_updated_at; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER "update_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();


--
-- Name: accepted_presentations accepted_presentations_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."accepted_presentations"
    ADD CONSTRAINT "accepted_presentations_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."presentation_submissions"("id");


--
-- Name: email_lookup email_lookup_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."email_lookup"
    ADD CONSTRAINT "email_lookup_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: organizers organizers_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."organizers"
    ADD CONSTRAINT "organizers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");


--
-- Name: presentation_presenters presentation_presenters_presentation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentation_submissions"("id") ON DELETE CASCADE;


--
-- Name: presentation_presenters presentation_presenters_presenter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."presentation_presenters"
    ADD CONSTRAINT "presentation_presenters_presenter_id_fkey" FOREIGN KEY ("presenter_id") REFERENCES "auth"."users"("id");


--
-- Name: presentation_submissions presentation_submissions_submitter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."presentation_submissions"
    ADD CONSTRAINT "presentation_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "auth"."users"("id");


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: public_profiles public_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."public_profiles"
    ADD CONSTRAINT "public_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");


--
-- Name: timezone_preferences timezone_preferences_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: supabase_admin
--

ALTER TABLE ONLY "public"."timezone_preferences"
    ADD CONSTRAINT "timezone_preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");


--
-- Name: profiles Accepted presenters profiles are viewable; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Accepted presenters profiles are viewable" ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "pp"."presenter_id"
   FROM ("public"."accepted_presentations"
     LEFT JOIN "public"."presentation_presenters" "pp" ON (("pp"."presentation_id" = "accepted_presentations"."id"))))));


--
-- Name: public_profiles Everyone can select public profiles.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Everyone can select public profiles." ON "public"."public_profiles" FOR SELECT USING (true);


--
-- Name: presentation_presenters List presenters if presentation accepted; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "List presenters if presentation accepted" ON "public"."presentation_presenters" FOR SELECT USING (("presentation_id" IN ( SELECT "accepted_presentations"."id"
   FROM "public"."accepted_presentations")));


--
-- Name: organizers Organizers can check their existence.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Organizers can check their existence." ON "public"."organizers" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: presentation_submissions Presenters and co-presenters can select; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Presenters and co-presenters can select" ON "public"."presentation_submissions" FOR SELECT USING (("auth"."uid"() IN ( SELECT "pp"."presenter_id"
   FROM "public"."presentation_presenters" "pp"
  WHERE ("pp"."presentation_id" = "presentation_submissions"."id"))));


--
-- Name: presentation_presenters Presenters can find their own entries; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Presenters can find their own entries" ON "public"."presentation_presenters" FOR SELECT USING (("presenter_id" = "auth"."uid"()));


--
-- Name: profiles Profiles listed as public are viewable by everyone.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Profiles listed as public are viewable by everyone." ON "public"."profiles" FOR SELECT USING (("id" IN ( SELECT "public_profiles"."id"
   FROM "public"."public_profiles")));


--
-- Name: presentation_submissions Submissions are viewable if accepted; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Submissions are viewable if accepted" ON "public"."presentation_submissions" FOR SELECT USING (("id" IN ( SELECT "accepted_presentations"."id"
   FROM "public"."accepted_presentations")));


--
-- Name: presentation_submissions Users can delete draft presentations; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can delete draft presentations" ON "public"."presentation_submissions" FOR DELETE USING ((("auth"."uid"() = "submitter_id") AND ("is_submitted" = false)));


--
-- Name: presentation_submissions Users can insert their own presentation submissions.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert their own presentation submissions." ON "public"."presentation_submissions" FOR INSERT WITH CHECK (("auth"."uid"() = "submitter_id"));


--
-- Name: profiles Users can insert their own profile.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: timezone_preferences Users can modify their timezone preferences; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can modify their timezone preferences" ON "public"."timezone_preferences" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));


--
-- Name: profiles Users can select their own profile; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can select their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: presentation_submissions Users can update own presentation submissions.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own presentation submissions." ON "public"."presentation_submissions" FOR UPDATE USING ((("auth"."uid"() = "submitter_id") AND ("is_submitted" = false)));


--
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: accepted_presentations; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."accepted_presentations" ENABLE ROW LEVEL SECURITY;

--
-- Name: accepted_presentations accepted_presentations are viewable; Type: POLICY; Schema: public; Owner: supabase_admin
--

CREATE POLICY "accepted_presentations are viewable" ON "public"."accepted_presentations" FOR SELECT USING (true);


--
-- Name: email_lookup; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."email_lookup" ENABLE ROW LEVEL SECURITY;

--
-- Name: organizers; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."organizers" ENABLE ROW LEVEL SECURITY;

--
-- Name: presentation_presenters; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."presentation_presenters" ENABLE ROW LEVEL SECURITY;

--
-- Name: presentation_submissions; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."presentation_submissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: public_profiles; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."public_profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: timezone_preferences; Type: ROW SECURITY; Schema: public; Owner: supabase_admin
--

ALTER TABLE "public"."timezone_preferences" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."algorithm_sign"("signables" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "blk_read_time" double precision, OUT "blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "sign"("payload" "json", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."sign"("payload" "json", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "try_cast_double"("inp" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."try_cast_double"("inp" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_decode"("data" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."url_decode"("data" "text") TO "dashboard_user";


--
-- Name: FUNCTION "url_encode"("data" "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."url_encode"("data" "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "verify"("token" "text", "secret" "text", "algorithm" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON FUNCTION "extensions"."verify"("token" "text", "secret" "text", "algorithm" "text") TO "dashboard_user";


--
-- Name: FUNCTION "get_all_presentations"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "postgres";
GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_presentations"() TO "service_role";


--
-- Name: FUNCTION "get_email_by_id"("user_id" "uuid"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_my_submissions"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "postgres";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_submissions"() TO "service_role";


--
-- Name: FUNCTION "get_presentation_ids"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "postgres";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"() TO "service_role";


--
-- Name: FUNCTION "get_presentation_ids"("p_id" "uuid"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_presentation_ids"("p_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: TABLE "presentation_presenters"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."presentation_presenters" TO "postgres";
GRANT ALL ON TABLE "public"."presentation_presenters" TO "anon";
GRANT ALL ON TABLE "public"."presentation_presenters" TO "authenticated";
GRANT ALL ON TABLE "public"."presentation_presenters" TO "service_role";


--
-- Name: FUNCTION "is_ok"("public"."presentation_presenters"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_presenters") TO "service_role";


--
-- Name: TABLE "presentation_submissions"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."presentation_submissions" TO "postgres";
GRANT ALL ON TABLE "public"."presentation_submissions" TO "anon";
GRANT ALL ON TABLE "public"."presentation_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."presentation_submissions" TO "service_role";


--
-- Name: FUNCTION "is_ok"("public"."presentation_submissions"); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "postgres";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ok"("public"."presentation_submissions") TO "service_role";


--
-- Name: FUNCTION "store_email"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."store_email"() TO "postgres";
GRANT ALL ON FUNCTION "public"."store_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."store_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."store_email"() TO "service_role";


--
-- Name: FUNCTION "update_updated_at"(); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "postgres";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "accepted_presentations"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."accepted_presentations" TO "postgres";
GRANT ALL ON TABLE "public"."accepted_presentations" TO "anon";
GRANT ALL ON TABLE "public"."accepted_presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."accepted_presentations" TO "service_role";


--
-- Name: TABLE "all_presentations"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."all_presentations" TO "postgres";
GRANT ALL ON TABLE "public"."all_presentations" TO "anon";
GRANT ALL ON TABLE "public"."all_presentations" TO "authenticated";
GRANT ALL ON TABLE "public"."all_presentations" TO "service_role";


--
-- Name: TABLE "email_lookup"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."email_lookup" TO "postgres";
GRANT ALL ON TABLE "public"."email_lookup" TO "anon";
GRANT ALL ON TABLE "public"."email_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."email_lookup" TO "service_role";


--
-- Name: TABLE "my_submissions"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."my_submissions" TO "postgres";
GRANT ALL ON TABLE "public"."my_submissions" TO "anon";
GRANT ALL ON TABLE "public"."my_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."my_submissions" TO "service_role";


--
-- Name: TABLE "organizers"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."organizers" TO "postgres";
GRANT ALL ON TABLE "public"."organizers" TO "anon";
GRANT ALL ON TABLE "public"."organizers" TO "authenticated";
GRANT ALL ON TABLE "public"."organizers" TO "service_role";


--
-- Name: TABLE "profiles"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."profiles" TO "postgres";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";


--
-- Name: TABLE "public_profiles"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."public_profiles" TO "postgres";
GRANT ALL ON TABLE "public"."public_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";


--
-- Name: TABLE "timezone_preferences"; Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON TABLE "public"."timezone_preferences" TO "postgres";
GRANT ALL ON TABLE "public"."timezone_preferences" TO "anon";
GRANT ALL ON TABLE "public"."timezone_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."timezone_preferences" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


--
-- PostgreSQL database dump complete
--


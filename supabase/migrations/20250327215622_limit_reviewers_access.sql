CREATE OR REPLACE FUNCTION "public"."get_reviewable_submissions"("target_year" "public"."summit_year") RETURNS TABLE("presentation_id" "uuid", "title" "text", "abstract" "text", "presentation_type" "public"."presentation_type", "learning_points" "text", "submitter_id" "uuid", "presenters" "public"."presenter_info"[], "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (SELECT count(*) FROM organizers WHERE id = auth.uid()) != 1 then
    -- Not an organizer
    RETURN;
  END IF;

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
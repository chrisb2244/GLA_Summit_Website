-- Update each call of auth.uid() highlighted in the Supabase advisor
-- to use a select subquery instead.

-- A subset of those previously 'fixed' are fixed again here due to parsing issues.

ALTER POLICY "OrganizersCanQueryEmails"
ON "public"."email_lookup"
TO authenticated
USING (
  (
    ( SELECT auth.uid() AS uid )
    IN
    ( SELECT organizers.id FROM organizers)
  )
);
ALTER POLICY "Specified users (log_viewers) can access the logs"
ON "public"."log"
TO authenticated
USING (
  (
    ( SELECT auth.uid() AS uid )
    IN
    ( SELECT log_viewers.user_id FROM log_viewers )
  )
);
ALTER POLICY "Organizers can check their existence."
ON "public"."organizers"
TO authenticated
USING (
  (SELECT auth.uid() AS uid) = id
);
ALTER POLICY "Organizers can query table"
ON "public"."presentation_presenters"
TO authenticated
USING (
   (
    ( SELECT auth.uid() AS uid )
    IN
    ( SELECT organizers.id FROM organizers)
  )
);
ALTER POLICY "Presenters can find their own entries"
ON "public"."presentation_presenters"
TO authenticated
USING (
  (presenter_id = (SELECT auth.uid() AS uid))
);
ALTER POLICY "Organizers can select submitted presentations"
ON "public"."presentation_submissions"
TO authenticated
USING (
  (
    (is_submitted = true) AND
    (
      ( SELECT auth.uid() AS uid )
      IN
      ( SELECT organizers.id FROM organizers)
    )
  )
);
ALTER POLICY "Presenters and co-presenters can select"
ON "public"."presentation_submissions"
TO public
USING (
  (
    (SELECT auth.uid() AS uid)
    IN
    (
      SELECT pp.presenter_id
      FROM presentation_presenters pp
      WHERE (pp.presentation_id = presentation_submissions.id)
    )
  )
);
ALTER POLICY "Selection for insertion (submitter)"
ON "public"."presentation_submissions"
TO authenticated
USING (
  ((SELECT auth.uid() AS uid) = submitter_id)
);
ALTER POLICY "Users can delete draft presentations"
ON "public"."presentation_submissions"
TO public
USING (
  (((SELECT auth.uid() AS uid) = submitter_id) AND (is_submitted = false))
);
ALTER POLICY "Users can insert their own presentation submissions."
ON "public"."presentation_submissions"
TO public
WITH CHECK (
  ((SELECT auth.uid() AS uid) = submitter_id)
);
ALTER POLICY "Users can update own presentation submissions."
ON "public"."presentation_submissions"
TO public
USING (
  (
    ((SELECT auth.uid() AS uid) = submitter_id)
    AND
    (is_submitted = false)
  )
);
ALTER POLICY "Organizers can view profiles of presentation submitters"
ON "public"."profiles"
TO authenticated
USING (
  ((id IN (
    SELECT presentation_presenters.presenter_id
    FROM presentation_presenters
    )
  ) AND (
    (SELECT auth.uid() AS uid) IN ( SELECT organizers.id FROM organizers)
  ))
);
ALTER POLICY "Users can insert their own profile."
ON "public"."profiles"
TO public
WITH CHECK (
  ((SELECT auth.uid() AS uid) = id)
);
ALTER POLICY "Users can select their own profile"
ON "public"."profiles"
TO public
USING (
  ((SELECT auth.uid() AS uid) = id)
);
ALTER POLICY "Users can update own profile."
ON "public"."profiles"
TO public
USING (
  ((SELECT auth.uid() AS uid) = id)
);
ALTER POLICY "Allow selecting your own presentation"
ON "public"."rejected_presentations"
TO authenticated
USING (
  (
    (SELECT auth.uid() AS uid)
    IN
    (
      SELECT pp.presenter_id
      FROM presentation_presenters pp
      WHERE (pp.presentation_id = rejected_presentations.id)
    )
  )
);
ALTER POLICY "Select own ticket"
ON "public"."tickets"
TO authenticated
USING (
  ((SELECT auth.uid() AS uid) = user_id)
);
ALTER POLICY "Users can modify their timezone preferences"
ON "public"."timezone_preferences"
TO public
USING (
  ((SELECT auth.uid() AS uid) = id)
)
WITH CHECK (
  ((SELECT auth.uid() AS uid) = id)
);
ALTER POLICY "insert_policy"
ON "public"."review_download_information"
TO authenticated
WITH CHECK (
  ((SELECT auth.uid() AS uid) = viewer_id)
);
ALTER POLICY "select_policy"
ON "public"."review_download_information"
TO authenticated
USING (
  ((SELECT auth.uid() AS uid) = viewer_id)
);
ALTER POLICY "update_policy"
ON "public"."review_download_information"
TO authenticated
USING (
  ((SELECT auth.uid() AS uid) = viewer_id)
)
WITH CHECK (
  ((SELECT auth.uid() AS uid) = viewer_id)
);

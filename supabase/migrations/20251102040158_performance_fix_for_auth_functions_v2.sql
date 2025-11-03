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

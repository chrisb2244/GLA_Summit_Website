-- Update each call of auth.uid() highlighted in the Supabase advisor
-- to use a select subquery instead.

ALTER POLICY "User can modify their own favourites"
ON "public"."agenda_favourites"
TO authenticated
USING (
  (user_id = (SELECT auth.uid()))
)
WITH CHECK (
  (user_id = (SELECT auth.uid()))
);
ALTER POLICY "OrganizersCanQueryEmails"
ON "public"."email_lookup"
TO authenticated
USING (
  (SELECT(auth.uid()) IN (SELECT organizers.id FROM organizers))
);
ALTER POLICY "Specified users (log_viewers) can access the logs"
ON "public"."log"
TO authenticated
USING (
  (SELECT(auth.uid()) IN (
    SELECT log_viewers.user_id
    FROM log_viewers
  ))
);
ALTER POLICY "Select yourself"
ON "public"."log_viewers"
TO authenticated
USING (
  (user_id = (SELECT(auth.uid())))
);
ALTER POLICY "Logged in users can register their own email"
ON "public"."mentoring"
TO authenticated
WITH CHECK (
  (email IN (
    SELECT mentoring.email
    FROM profiles
    WHERE (profiles.id = (SELECT(auth.uid())))
  ))
);
ALTER POLICY "Users can read their own status"
ON "public"."mentoring"
TO public
USING ((email IN (
    SELECT mentoring.email
    FROM profiles
    WHERE (profiles.id = (SELECT(auth.uid())))
)));
ALTER POLICY "Insert own ticket"
ON "public"."tickets"
TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()))
);
ALTER POLICY "Select own ticket"
ON "public"."tickets"
TO authenticated
USING (
  (SELECT(auth.uid()) = user_id)
);
ALTER POLICY "Users can modify their timezone preferences"
ON "public"."timezone_preferences"
TO public
USING (
  (SELECT(auth.uid()) = id)
)
WITH CHECK (
  (SELECT(auth.uid()) = id)
);

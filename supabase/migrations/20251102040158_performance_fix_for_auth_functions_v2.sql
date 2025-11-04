-- Update each call of auth.uid() highlighted in the Supabase advisor
-- to use a select subquery instead.

-- A subset of those previously 'fixed' are fixed again here due to parsing issues.


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
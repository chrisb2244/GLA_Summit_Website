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

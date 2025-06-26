create policy "OrganizersCanQueryEmails"
on "public"."email_lookup"
as permissive
for select
to authenticated
using ((auth.uid() IN ( SELECT organizers.id
   FROM organizers)));
-- This policy allows authenticated users who are organizers to query the email_lookup table.

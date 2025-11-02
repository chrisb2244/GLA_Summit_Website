REVOKE ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") FROM "public";
REVOKE ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_email_by_id"("user_id" "uuid") FROM "authenticated";

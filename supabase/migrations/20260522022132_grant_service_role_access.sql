-- Grant permissions on all public tables to service_role role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentation_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentation_presenters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accepted_presentations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rejected_presentations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_favourites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmed_presentations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.container_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_lookup TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.log_viewers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentoring TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_download_information TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_sequences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timezone_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_links TO service_role;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Function access for service_role (previous migrations handled REVOKING for various roles but did not GRANT to service_role)
GRANT EXECUTE ON FUNCTION public.store_email TO service_role;

-- Function access for authenticated (missed change)
GRANT EXECUTE ON FUNCTION public.get_my_submissions TO authenticated;

-- Function access for supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.store_email TO supabase_auth_admin;
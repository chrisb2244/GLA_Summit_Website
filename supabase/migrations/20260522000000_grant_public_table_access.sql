-- Grant table permissions on public schema tables to anon and authenticated roles
-- These grants are necessary for RLS policies to be evaluated
-- RLS acts as a layer above role permissions

-- Grant permissions on all public tables to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.organizers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentation_submissions TO authenticated;
GRANT SELECT ON public.presentation_presenters TO authenticated;
GRANT SELECT ON public.accepted_presentations TO authenticated;
GRANT SELECT ON public.rejected_presentations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_favourites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.confirmed_presentations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.container_groups TO authenticated;
GRANT SELECT ON public.email_lookup TO authenticated;
GRANT SELECT ON public.log TO authenticated;
GRANT SELECT ON public.log_viewers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentoring TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_download_information TO authenticated;
-- No permissions for public.ticket_sequences
GRANT SELECT, INSERT ON public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timezone_preferences TO authenticated;
GRANT SELECT ON public.video_links TO authenticated;

-- Grant SELECT permissions on public tables to anon role
-- (anon typically has more limited access than authenticated)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.accepted_presentations TO anon;
GRANT SELECT ON public.container_groups TO anon;
GRANT SELECT ON public.presentation_submissions TO anon;
GRANT SELECT ON public.presentation_presenters TO anon;
GRANT SELECT ON public.video_links TO anon;

-- Grant INSERT on mentoring to allow unauthenticated signup
GRANT INSERT ON public.mentoring TO anon;

-- Also need to grant USAGE on sequences and functions if they exist
-- Grant usage on any sequences in public schema
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

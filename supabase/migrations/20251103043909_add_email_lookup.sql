-- Create the email_lookup table
CREATE TABLE IF NOT EXISTS public.email_lookup (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    email text NOT NULL
);
ALTER TABLE public.email_lookup ENABLE ROW LEVEL SECURITY;
-- Add triggers for the creation of new users
CREATE OR REPLACE FUNCTION public.store_email()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    BEGIN
    INSERT INTO public.email_lookup (id, email)
      VALUES (new.id, new.email);
      RETURN new;
    END;
  $$;
REVOKE ALL ON FUNCTION public.store_email FROM public;
REVOKE ALL ON FUNCTION public.store_email FROM anon;
REVOKE ALL ON FUNCTION public.store_email FROM authenticated;
CREATE TRIGGER on_auth_user_created_emails
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION store_email();

-- Create policies for the email_lookup table
CREATE POLICY "OrganizersCanQueryEmails"
  ON public.email_lookup
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN ( SELECT organizers.id FROM organizers));

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at timestamptz DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    avatar_url text,
    website text,
    bio text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Configure triggers to seed the table for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    BEGIN
    INSERT INTO public.profiles (id, firstname, lastname)
      VALUES (new.id, new.raw_user_meta_data->>'firstname', new.raw_user_meta_data->>'lastname');
      RETURN new;
    END;
  $$;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
-- Add a trigger to store the updated time
CREATE OR REPLACE FUNCTION public.update_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $$
    BEGIN
      NEW.updated_at = (now() at time zone 'utc');
      RETURN NEW;
    END;
  $$;
CREATE OR REPLACE TRIGGER update_profile_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
-- Add policies that only require the profiles table
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can select their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Create the public_profiles table
CREATE TABLE IF NOT EXISTS public.public_profiles (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
-- Add policies for access
CREATE POLICY "Everyone can select public profile ids"
  ON public.public_profiles
  FOR SELECT
  USING (true);
-- Allow profiles listed as public to be read by anyone
CREATE POLICY "Profiles listed as public are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (id IN (SELECT public_profiles.id FROM public.public_profiles));

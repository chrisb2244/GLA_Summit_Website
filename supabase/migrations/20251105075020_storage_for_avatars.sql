CREATE POLICY "Authenticated users can upload an avatar."
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK ((bucket_id = 'avatars'::text));

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects
  FOR SELECT
  TO public
  USING ((bucket_id = 'avatars'::text));

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = owner));

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = owner));


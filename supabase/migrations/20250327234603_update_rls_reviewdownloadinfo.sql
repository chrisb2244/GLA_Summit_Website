ALTER POLICY insert_policy ON review_download_information
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- Create a policy to allow the user to update rows with their user_id
ALTER POLICY update_policy ON review_download_information
  TO authenticated
  USING (auth.uid() = viewer_id)
  WITH CHECK (auth.uid() = viewer_id);

-- Create a policy to allow the user to select rows with their user_id
ALTER POLICY select_policy ON review_download_information
  TO authenticated
  USING (auth.uid() = viewer_id);
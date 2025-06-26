-- Create the table for review download information
CREATE TABLE review_download_information (
  presentation_id UUID NOT NULL REFERENCES presentation_submissions (id),
  viewer_id UUID NOT NULL REFERENCES auth.users (id) DEFAULT auth.uid(),
  last_downloaded TIMESTAMP DEFAULT now(),
  PRIMARY KEY (presentation_id, viewer_id)
);

-- Enable Row-Level Security (RLS) on the table
ALTER TABLE review_download_information ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow the user to insert rows with their user_id
CREATE POLICY insert_policy ON review_download_information
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Create a policy to allow the user to update rows with their user_id
CREATE POLICY update_policy ON review_download_information
  FOR UPDATE
  WITH CHECK (auth.uid() = viewer_id);

-- Create a policy to allow the user to select rows with their user_id
CREATE POLICY select_policy ON review_download_information
  FOR SELECT
  USING (auth.uid() = viewer_id);
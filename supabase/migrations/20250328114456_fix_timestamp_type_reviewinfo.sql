ALTER TABLE review_download_information
  ALTER COLUMN last_downloaded TYPE timestamptz USING last_downloaded AT TIME ZONE 'UTC';
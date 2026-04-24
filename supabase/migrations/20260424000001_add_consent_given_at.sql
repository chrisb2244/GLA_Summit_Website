-- Add consent_given_at to record when a presenter agreed to the speaker agreement.
-- NULL means consent has not yet been given (draft or legacy submission).
ALTER TABLE "public"."presentation_submissions"
  ADD COLUMN IF NOT EXISTS "consent_given_at" TIMESTAMPTZ;

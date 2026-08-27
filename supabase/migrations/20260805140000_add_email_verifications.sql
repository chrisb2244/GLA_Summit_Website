-- Proving ownership of an address before it joins an account.
--
-- GoTrue can only mint a code for an address it already holds, so adding a
-- second address to an account needs a code of our own. This table is that
-- code's storage; the app (server actions, admin client) owns the flow.
--
-- Rows here are claims, not addresses: an address only reaches
-- public.account_emails once its code has been entered, so account_emails
-- continues to mean "addresses this account has proven it can receive". Two
-- accounts may therefore hold a live claim on the same address; whichever
-- verifies first takes it, and the loser's insert is refused by the unique
-- index on account_emails.email.

CREATE TABLE public.email_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id)
                ON UPDATE CASCADE ON DELETE CASCADE,
  email       text NOT NULL,
  code_hash   text NOT NULL, -- Digest, not the code, for hashed comparison
  attempts    smallint NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_verifications_email_is_lowercase CHECK (email = lower(email))
);
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- The lookup the confirm step makes: the live claim for this user and address.
CREATE INDEX email_verifications_live_idx
  ON public.email_verifications (user_id, email)
  WHERE consumed_at IS NULL;
-- Supports the rate-limit count and the expiry sweep.
CREATE INDEX email_verifications_created_idx
  ON public.email_verifications (user_id, created_at DESC);

-- No policies, and nothing granted to anon or authenticated: this table is only
-- ever touched by server actions through the service key.
REVOKE ALL ON public.email_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_verifications TO service_role;

COMMENT ON TABLE public.email_verifications IS
  'Pending proof-of-ownership claims for addresses being added to an account. Consumed rows are kept as an audit trail of who added what and when.';

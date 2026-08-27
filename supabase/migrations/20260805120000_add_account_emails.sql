-- Multiple email addresses per account.
--
-- Until now an account had exactly one address: public.email_lookup held one
-- row per user, written by an INSERT-only trigger on auth.users. That models
-- the address as immutable, which it is not — people lose access to old
-- workplace addresses and employers change domains — and it breaks silently if
-- an address is ever changed (e.g. in the Supabase dashboard), because the app
-- resolves sign-ins through email_lookup while GoTrue authenticates against
-- auth.users.email. The two would disagree and the account would be locked out.
--
-- public.account_emails replaces the email_lookup table: it contains one row per
-- (account, address), exactly one of which is primary — the address GoTrue holds in
-- auth.users.email. Every other user-owned table in this schema keys on
-- profiles.id, so nothing else has to change. email_lookup itself goes: its
-- readers (get_editable_submission_emails, get_my_submissions, email_has_account,
-- and the app's co-presenter lookup) move to the new table in this same
-- migration and the commit that carries it.


-- =============================================================================
-- 1. The table
-- =============================================================================

CREATE TABLE public.account_emails (
  user_id     uuid NOT NULL REFERENCES public.profiles(id)
                ON UPDATE CASCADE ON DELETE CASCADE,
  email       text NOT NULL,
  is_primary  boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, email),
  -- Stored normalised, so the unique index below is a real constraint rather
  -- than a case-sensitive near-miss. Callers must lower() before writing.
  CONSTRAINT account_emails_email_is_lowercase CHECK (email = lower(email)),
  -- The primary address is the one GoTrue authenticates, so it is verified by
  -- definition. An unverified address must never become a sign-in identity.
  CONSTRAINT account_emails_primary_is_verified
    CHECK (NOT is_primary OR verified_at IS NOT NULL)
);
ALTER TABLE public.account_emails ENABLE ROW LEVEL SECURITY;

-- An address identifies at most one account.
CREATE UNIQUE INDEX account_emails_email_key
  ON public.account_emails (email);
-- At most one primary per account (zero only transiently, mid-transaction).
CREATE UNIQUE INDEX account_emails_one_primary_per_user
  ON public.account_emails (user_id) WHERE is_primary;
-- The readers that want one address per account filter on is_primary; the
-- partial index above serves that, but joins from account rows want the plain
-- user_id order too.
CREATE INDEX account_emails_user_idx
  ON public.account_emails (user_id);

-- The partial index enforces "at most one primary". This enforces the other
-- half: an account holding any address holds exactly one primary. Without it,
-- deleting a primary row leaves an account with aliases it cannot sign in with
-- — resolve_account_email joins to the primary, so such an account resolves to
-- nothing and is locked out silently.
--
-- DEFERRABLE INITIALLY DEFERRED because reassigning the primary is legitimately
-- two statements (demote, then promote): the invariant must hold at commit, not
-- between statements. An account with no addresses at all is allowed — that is
-- a phone-only account, or one being deleted.
-- SECURITY DEFINER, like store_email: the deferred check fires at commit as
-- whichever role wrote the row, and that is usually supabase_auth_admin (GoTrue
-- creating or updating a user), which holds no privileges on this table.
CREATE OR REPLACE FUNCTION public.assert_account_has_one_primary(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    DECLARE
      total     integer;
      primaries integer;
    BEGIN
      SELECT count(*), count(*) FILTER (WHERE is_primary)
        INTO total, primaries
        FROM public.account_emails
        WHERE user_id = p_user_id;

      IF total > 0 AND primaries <> 1 THEN
        RAISE EXCEPTION
          'account % holds % address(es) but % primary address(es); exactly one is required',
          p_user_id, total, primaries
          USING ERRCODE = '23514';
      END IF;
    END;
  $$;

CREATE OR REPLACE FUNCTION public.check_account_emails_primary()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    BEGIN
      -- Both sides, so moving a row between accounts is checked at both ends.
      IF TG_OP <> 'INSERT' THEN
        PERFORM public.assert_account_has_one_primary(old.user_id);
      END IF;
      IF TG_OP <> 'DELETE' THEN
        PERFORM public.assert_account_has_one_primary(new.user_id);
      END IF;
      RETURN NULL;
    END;
  $$;

REVOKE ALL ON FUNCTION public.assert_account_has_one_primary(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_account_emails_primary()
  FROM PUBLIC, anon, authenticated;

CREATE CONSTRAINT TRIGGER account_emails_exactly_one_primary
  AFTER INSERT OR UPDATE OR DELETE ON public.account_emails
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.check_account_emails_primary();


-- =============================================================================
-- 2. Backfill
-- =============================================================================
-- Two sources, in priority order:
--   * auth.users — the authority for the primary address. This also covers any
--     account created before email_lookup existed (its migration added no
--     backfill) and any address changed since, neither of which has a row.
--   * email_lookup — anything it holds that auth.users no longer does is a
--     previous address of that account, kept as a verified alias so the account
--     can still be reached by it.
--
-- A duplicate address across two accounts cannot be represented and must be
-- resolved by merging the accounts, so fail loudly rather than silently drop
-- one. (Expected to be a no-op: GoTrue already enforces this.)
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT count(*) INTO duplicate_count
  FROM (
    SELECT lower(email)
    FROM auth.users
    WHERE email IS NOT NULL AND deleted_at IS NULL
    GROUP BY lower(email)
    HAVING count(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Cannot backfill account_emails: % address(es) are shared by more than one auth.users row',
      duplicate_count;
  END IF;
END $$;

-- verified_at falls back to created_at because the primary address cannot be
-- null-verified (see the CHECK above) and email_confirmed_at is null for an
-- account that never completed an OTP — a co-presenter created by an invite,
-- say. Their address is still the identity GoTrue authenticates, and it is how
-- they have been signing in, so it has to resolve. The fallback is a
-- placeholder standing where evidence would be, not a claim that the address
-- was proven at that time.
INSERT INTO public.account_emails (user_id, email, is_primary, verified_at)
SELECT u.id, lower(u.email), true, coalesce(u.email_confirmed_at, u.created_at)
FROM auth.users u
WHERE u.email IS NOT NULL
  AND u.deleted_at IS NULL
  -- profiles is this table's FK target - ensure it has a suitable row to avoid
  -- breaking the migration (this should always be true for production data).
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Former addresses. ON CONFLICT DO NOTHING covers both the common case (the
-- address is already in as the primary) and the pathological one (a stale row
-- naming an address that now belongs to a different account). No profiles guard
-- is needed here: email_lookup.id is itself a foreign key onto profiles.
INSERT INTO public.account_emails (user_id, email, is_primary, verified_at)
SELECT el.id, lower(el.email), false, now()
FROM public.email_lookup el
ON CONFLICT DO NOTHING;


-- =============================================================================
-- 3. email_lookup goes, and its two remaining readers move
-- =============================================================================
-- Dropping the table takes its policies and grants with it. Nothing references
-- it by foreign key, and its readers are string function bodies, which resolve
-- at execution time — so the drop below succeeds whether or not they have been
-- moved, and a missed one would fail at first call rather than here. They are
-- therefore restated in this same migration.
--
-- No compatibility view is left behind (views are nullable, which makes use more
-- tedious, and so completely removing is cleaner).
DROP TABLE public.email_lookup;

-- Both joins gain "AND ae.is_primary". Without it an account holding an alias
-- contributes a row per address: get_editable_submission_emails would agg the
-- same presenter's addresses into its array twice over, and get_my_submissions
-- would duplicate that presenter across every one of its per-presenter arrays,
-- putting them out of step with each other. One address per presenter is what
-- both have always returned, and the primary is the one to return.

-- Rewritten to use the new table
CREATE OR REPLACE FUNCTION public.email_has_account(p_email text)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.account_emails ae WHERE ae.email = p_email
    );
  $$;

-- Restated from 20260427000000; only the join changed.
CREATE OR REPLACE FUNCTION public.get_editable_submission_emails(
  p_presentation_id uuid
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_can_access boolean;
  presenter_emails text[];
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.presentation_presenters pp
    WHERE pp.presentation_id = p_presentation_id
      AND pp.presenter_id = auth.uid()
  )
  INTO user_can_access;

  IF NOT user_can_access THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(array_agg(ae.email ORDER BY ae.email), ARRAY[]::text[])
  INTO presenter_emails
  FROM public.presentation_presenters pp
  JOIN public.account_emails ae
    ON ae.user_id = pp.presenter_id AND ae.is_primary
  WHERE pp.presentation_id = p_presentation_id;

  RETURN presenter_emails;
END;
$$;

-- Restated from 20260527210000; only the join changed.
CREATE OR REPLACE FUNCTION public.get_my_submissions()
 RETURNS TABLE(
   presentation_id uuid,
   title text,
   abstract text,
   learning_points text,
   presentation_type presentation_type,
   submitter_id uuid,
   is_submitted boolean,
   year summit_year,
   updated_at timestamptz,
   all_presenters_ids uuid[],
   all_firstnames text[],
   all_lastnames text[],
   all_presenter_emails text[],
   all_presenter_statuses text[]
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
SELECT
      ps.id as presentation_id,
      ps.title,
      ps.abstract,
      ps.learning_points,
      ps.presentation_type,
      ps.submitter_id,
      ps.is_submitted,
      ps.year,
      ps.updated_at,
      array_agg(ppn.presenter_id) as all_presenters_ids,
      array_agg(ppn.firstname) as all_firstnames,
      array_agg(ppn.lastname) as all_lastnames,
      array_agg(ppn.email) as all_presenter_emails,
      array_agg(ppn.status) as all_presenter_statuses
    FROM public.presentation_submissions ps
    JOIN (
      SELECT
        pp.presentation_id,
        pp.presenter_id,
        pp.status,
        CASE WHEN pp.status = 'accepted' THEN prof.firstname ELSE NULL END AS firstname,
        CASE WHEN pp.status = 'accepted' THEN prof.lastname ELSE NULL END AS lastname,
        ae.email
      FROM public.presentation_presenters pp
      LEFT JOIN public.profiles prof
        ON pp.presenter_id = prof.id
      LEFT JOIN public.account_emails ae
        ON ae.user_id = pp.presenter_id AND ae.is_primary
    ) ppn on ps.id = ppn.presentation_id
    WHERE presentation_id IN (
      SELECT presentation_id
      FROM public.presentation_presenters ppp
      WHERE ppp.presenter_id = auth.uid()
    )
    GROUP BY ps.id;
  $function$;


-- =============================================================================
-- 4. Access control
-- =============================================================================
-- Reads mirror the old table: organizers see every address. A user seeing their
-- own rows is new, and is what the "manage my addresses" UI will read.
CREATE POLICY "OrganizersCanQueryEmails"
  ON public.account_emails
  FOR SELECT
  TO authenticated
  USING (public.is_organizer());

CREATE POLICY "Users can query their own addresses"
  ON public.account_emails
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- No INSERT/UPDATE/DELETE policies: adding or removing an address must go
-- through a verification flow, so writes are limited to service_role and the
-- SECURITY DEFINER trigger below.
--
-- REVOKE first, then grant exactly what is needed. A plain GRANT would only be
-- additive: this project's `public` schema may carry ALTER DEFAULT PRIVILEGES
-- entries (Supabase previously shipped blanket grants to anon/authenticated),
-- in which case a new table arrives already granted and the GRANT list
-- below would not be the whole story. RLS would still deny the writes, but the
-- privilege should not be there to begin with.
REVOKE ALL ON public.account_emails FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.account_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_emails TO service_role;


-- =============================================================================
-- 5. Keep the primary address in step with GoTrue
-- =============================================================================
-- store_email() previously only handled INSERT. It now also runs on an address
-- change.
CREATE OR REPLACE FUNCTION public.store_email()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $$
    BEGIN
      -- Phone-only accounts have no address to record.
      IF new.email IS NULL THEN
        RETURN new;
      END IF;

      IF TG_OP = 'UPDATE' THEN
        -- Demote before promoting: one primary per account is enforced by a
        -- partial unique index. The old address stays as a verified alias — it
        -- is how this account has been signing in until now, and keeping it
        -- means a change to an address the user cannot actually receive is
        -- recoverable.
        UPDATE public.account_emails
          SET is_primary = false
          WHERE user_id = new.id AND is_primary;
      END IF;

      INSERT INTO public.account_emails (user_id, email, is_primary, verified_at)
        VALUES (
          new.id,
          lower(new.email),
          true,
          coalesce(new.email_confirmed_at, now())
        )
        ON CONFLICT (user_id, email) DO UPDATE
          SET is_primary = true,
              verified_at = coalesce(
                account_emails.verified_at,
                excluded.verified_at
              );
      RETURN new;
    END;
  $$;

-- The INSERT trigger (on_auth_user_created_emails, added with email_lookup)
-- still calls this function and needs no change. Its name must continue to sort
-- after on_auth_user_created: triggers fire in name order, and the profiles row
-- it creates is this table's foreign key target.
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (new.email IS DISTINCT FROM old.email)
  EXECUTE FUNCTION public.store_email();

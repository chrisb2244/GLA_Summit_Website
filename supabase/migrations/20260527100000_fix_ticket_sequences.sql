-- Backfill schema qualifier on existing sequence name values.
-- With SET search_path TO '' in SECURITY DEFINER functions, nextval() cannot
-- resolve an unqualified name like 'ticket_sequence_2026'; it requires the
-- fully-qualified form 'public.ticket_sequence_2026'.
UPDATE public.ticket_sequences
SET name = 'public.' || name
WHERE name IS NOT NULL
  AND name NOT LIKE 'public.%';

-- Fix create_ticket_sequence().
--
-- Changes:
-- 1. Default name is now schema-qualified ('public.ticket_sequence_<year>')
--    so that functions using SET search_path TO '' can call nextval() on it
--    without a search_path fallback.
-- 2. EXECUTE now operates on a schema-qualified name, making it safe under
--    an empty search_path.
-- 3. Adds an explicit GRANT after sequence creation. The one-time
--    GRANT USAGE ON ALL SEQUENCES migration only covers sequences that exist
--    at the time it runs; each dynamically created sequence needs its own
--    grant.
--
-- SET search_path TO '': this function is not SECURITY DEFINER, so there is
-- no privilege-escalation attack vector via search_path manipulation. The
-- setting is included for consistency and to prevent implicit schema
-- resolution if the function is ever extended.
--
-- Note: EXECUTE uses string concatenation rather than format('%I') because
-- NEW.name may be a qualified identifier ('schema.name') that %I would
-- mis-quote as a single double-quoted token. The name is either
-- auto-generated from a controlled enum value or set by a service_role
-- caller, both of which are trusted.
CREATE OR REPLACE FUNCTION public.create_ticket_sequence()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
  AS $$
  BEGIN
    IF NEW.name IS NULL THEN
      NEW.name := 'public.ticket_sequence_' || NEW.year::text;
    END IF;
    EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || NEW.name;
    EXECUTE 'GRANT USAGE ON SEQUENCE ' || NEW.name || ' TO authenticated, anon';
    RETURN NEW;
  END
  $$;

-- Fix calculate_ticket_number().
--
-- Changes:
-- 1. SECURITY DEFINER: the trigger may fire in an authenticated-role context
--    (authenticated has neither SELECT on ticket_sequences nor guaranteed
--    USAGE on dynamically created sequences). Running as the function owner
--    resolves both permission gaps.
-- 2. SET search_path TO '': mandatory for SECURITY DEFINER functions.
--    Without it, a caller who has manipulated their session search_path
--    could cause this elevated-privilege function to resolve names against
--    attacker-controlled objects placed earlier in the path.
-- 3. Looks up the sequence name from ticket_sequences.name (the
--    authoritative source) rather than reconstructing it with a hardcoded
--    pattern. Because the stored name is now schema-qualified (see backfill
--    above), nextval() resolves it correctly under an empty search_path.
CREATE OR REPLACE FUNCTION public.calculate_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
  AS $$
  DECLARE
    seq_name text;
  BEGIN
    SELECT name INTO seq_name
    FROM public.ticket_sequences
    WHERE year = NEW.year;

    IF seq_name IS NULL THEN
      RAISE EXCEPTION 'No ticket sequence configured for year %', NEW.year;
    END IF;

    -- seq_name is schema-qualified (e.g. 'public.ticket_sequence_2026').
    -- The explicit ::regclass cast makes the schema resolution unambiguous;
    -- nextval() would also accept plain text via implicit coercion, but the
    -- cast is clearer about intent.
    NEW.ticket_number := nextval(seq_name::regclass);
    RETURN NEW;
  END
  $$;

-- Atomic get-or-create ticket RPC, replacing the application-layer
-- check-then-insert that was prone to race conditions.
--
-- Two concurrent requests for the same (user, year) could both pass the
-- existence check and both attempt an INSERT; the loser would consume a
-- sequence value (via the calculate_ticket_number trigger) without
-- committing a row, creating a permanent gap in ticket numbers. An advisory
-- lock acquired before the check serialises concurrent pairs, preventing
-- the sequence from advancing for a request that will not produce a row.
--
-- SECURITY DEFINER: runs as the function owner, bypassing RLS and resolving
-- sequence permission issues. auth.uid() is used to scope all data
-- operations strictly to the calling user, providing equivalent protection
-- to the RLS policy.
-- SET search_path TO '': mandatory for SECURITY DEFINER (see reasoning in
-- calculate_ticket_number above). All object references below are
-- schema-qualified or are pg_catalog built-ins, which are always resolved
-- implicitly regardless of the search_path setting.
CREATE OR REPLACE FUNCTION public.get_or_create_ticket(p_year public.summit_year)
 RETURNS SETOF public.tickets
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
  AS $$
  DECLARE
    v_user_id uuid;
    v_ticket public.tickets;
  BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;

    -- pg_advisory_xact_lock / hashtext are pg_catalog built-ins and are
    -- found without a search_path. The lock is transaction-level (released
    -- automatically at transaction end), which is safe with pgbouncer
    -- transaction-mode connection pooling.
    -- Two int4 arguments avoid conflating different (user, year) pairs that
    -- happen to produce the same combined hash.
    PERFORM pg_advisory_xact_lock(
      hashtext(v_user_id::text),
      hashtext(p_year::text)
    );

    SELECT * INTO v_ticket
    FROM public.tickets
    WHERE user_id = v_user_id AND year = p_year;

    IF FOUND THEN
      RETURN NEXT v_ticket;
      RETURN;
    END IF;

    -- ticket_number is overwritten by the calculate_ticket_number trigger
    INSERT INTO public.tickets (user_id, year, ticket_number)
    VALUES (v_user_id, p_year, 0)
    RETURNING * INTO v_ticket;

    RETURN NEXT v_ticket;
  END
  $$;

REVOKE ALL ON FUNCTION public.get_or_create_ticket(public.summit_year) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_or_create_ticket(public.summit_year) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_ticket(public.summit_year) TO authenticated;

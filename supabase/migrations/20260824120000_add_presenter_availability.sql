-- When can a presenter present?
--
-- The summit runs as a single unbroken 24-hour block starting at 12:00 UTC
-- (see frontend/src/app/configConstants.ts, summitStartDates). Scheduling it
-- means placing every accepted presentation somewhere in those 24 hours, for
-- speakers spread across every timezone there is — so the one thing the
-- organizers most need, and currently have to chase over email, is which of
-- those hours each presenter can actually be awake for.
--
-- public.presenter_availability records that as a set of one-hour slots. One
-- row per (account, year, slot) means "I can present in this hour"; the
-- absence of a row means nothing has been said, which is deliberately the same
-- as "no" for scheduling purposes — an empty set is an unanswered question,
-- not a claim of total availability.
--
-- Slots are stored as the absolute UTC instant the hour begins. Timezone is
-- purely a display concern (the UI renders each slot in the viewer's zone
-- alongside UTC), so nothing here stores one: an instant means the same thing
-- to a presenter in Auckland and one in Los Angeles, and a stored offset would
-- be one more thing to get wrong across a DST boundary.


-- =============================================================================
-- 1. The table
-- =============================================================================

CREATE TABLE public.presenter_availability (
  user_id    uuid NOT NULL REFERENCES public.profiles(id)
               ON UPDATE CASCADE ON DELETE CASCADE,
  year       public.summit_year NOT NULL,
  slot_start timestamptz NOT NULL,
  set_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year, slot_start),
  -- The grid is hourly, and every reader assumes it: a row half an hour off
  -- would never line up with a rendered slot and would silently vanish from
  -- the UI while still counting in an organizer's query.
  CONSTRAINT presenter_availability_slot_is_on_the_hour
    CHECK (slot_start = date_trunc('hour', slot_start))
);
ALTER TABLE public.presenter_availability ENABLE ROW LEVEL SECURITY;

-- Organizers read this the other way round from presenters: "who is free at
-- 03:00?", scanning a year's rows by slot, not by account.
CREATE INDEX presenter_availability_year_slot_idx
  ON public.presenter_availability (year, slot_start);

COMMENT ON TABLE public.presenter_availability IS
  'One row per hour a presenter has said they can present in, per summit year. '
  'slot_start is the UTC instant the hour begins; no row means "not stated", '
  'which scheduling treats as unavailable.';


-- =============================================================================
-- 2. Access
-- =============================================================================

-- A presenter owns their own answer outright: they can see it, add hours,
-- and take hours back. There is no UPDATE policy because there is nothing to
-- update — a slot is present or it is not, so the UI writes a diff of
-- INSERTs and DELETEs rather than mutating rows in place. Leaving UPDATE
-- unpoliced also means a row can never be moved onto another account's
-- user_id, which a permissive UPDATE policy would otherwise allow.
CREATE POLICY "Users can read their own availability"
  ON public.presenter_availability
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can declare their own availability"
  ON public.presenter_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can withdraw their own availability"
  ON public.presenter_availability
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Organizers are the reason the table exists; they read everyone's, and only
-- read. Nobody else sees another account's availability at all — it says
-- something about a person's working hours and sleep, which is not public
-- information the way an accepted talk's title is.
CREATE POLICY "Organizers can read all availability"
  ON public.presenter_availability
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT organizers.id FROM public.organizers));

GRANT SELECT, INSERT, DELETE ON public.presenter_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presenter_availability TO service_role;

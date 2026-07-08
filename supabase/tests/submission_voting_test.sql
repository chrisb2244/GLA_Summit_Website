-- pgTAP tests for the organizer-voting accept/decline trigger
-- (evaluate_submission_votes). Run with: npx supabase test db
--
-- The trigger counts ALL organizers (the accept rule needs full participation),
-- so the organizer set is global. Each scenario resets it via pg_temp.reset_orgs
-- and votes on its own presentation. Scenarios 1-8 run as the postgres superuser
-- to exercise the trigger logic directly (superuser bypasses RLS); scenario 9
-- switches to the authenticated role to verify the RLS vote-lock; scenarios 10-13
-- mutate public.organizers after voting to confirm the roster-change behaviour
-- (re-evaluation on organizer removal, and the deliberate no-op on addition).
--
-- User ids:        11111111-1111-1111-1111-1111111100 0{1..6}
-- Presentation ids: 22222222-2222-2222-2222-2222222200{01..11}

BEGIN;
SELECT plan(30);

-- ---------------------------------------------------------------------------
-- Fixtures: six users (profiles auto-created by the on_auth_user_created
-- trigger) and one submission per scenario.
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('11111111-1111-1111-1111-111111110001', 'u1@test.dev', '{"firstname":"U","lastname":"One"}'),
  ('11111111-1111-1111-1111-111111110002', 'u2@test.dev', '{"firstname":"U","lastname":"Two"}'),
  ('11111111-1111-1111-1111-111111110003', 'u3@test.dev', '{"firstname":"U","lastname":"Three"}'),
  ('11111111-1111-1111-1111-111111110004', 'u4@test.dev', '{"firstname":"U","lastname":"Four"}'),
  ('11111111-1111-1111-1111-111111110005', 'u5@test.dev', '{"firstname":"U","lastname":"Five"}'),
  ('11111111-1111-1111-1111-111111110006', 'u6@test.dev', '{"firstname":"U","lastname":"Six"}');

INSERT INTO public.presentation_submissions
  (id, submitter_id, title, abstract, is_submitted, presentation_type, year)
SELECT
  ('22222222-2222-2222-2222-2222222200' || lpad(g::text, 2, '0'))::uuid,
  '11111111-1111-1111-1111-111111110001',
  'Talk ' || g, 'Abstract ' || g, true, 'full length', '2026'
FROM generate_series(1, 14) g;

-- Reset the (global) organizer set and clear all votes/outcomes between
-- scenarios. Votes are cleared before organizers so the FK cascade has nothing
-- to re-trigger.
CREATE FUNCTION pg_temp.reset_orgs(org_ids uuid[]) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.submission_votes;
  DELETE FROM public.accepted_presentations;
  DELETE FROM public.rejected_presentations;
  DELETE FROM public.organizers;
  INSERT INTO public.organizers (id) SELECT unnest(org_ids);
END;
$$;

-- Cast (or change) a vote as the postgres superuser (bypasses RLS).
CREATE FUNCTION pg_temp.vote(p_pres uuid, p_org uuid, p_vote public.organizer_vote)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.submission_votes (presentation_id, organizer_id, vote)
    VALUES (p_pres, p_org, p_vote)
  ON CONFLICT (presentation_id, organizer_id) DO UPDATE SET vote = excluded.vote;
END;
$$;

-- Attempt to cast a vote as an authenticated organizer (RLS applies). Returns
-- true if the insert succeeded, false if it was blocked.
CREATE FUNCTION pg_temp.try_vote_as(p_user uuid, p_pres uuid, p_vote public.organizer_vote)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE allowed boolean := true;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user::text)::text, true);
  BEGIN
    INSERT INTO public.submission_votes (presentation_id, organizer_id, vote)
      VALUES (p_pres, p_user, p_vote);
  EXCEPTION WHEN OTHERS THEN
    allowed := false;
  END;
  PERFORM set_config('role', 'postgres', true);
  RETURN allowed;
END;
$$;

-- Count helpers.
CREATE FUNCTION pg_temp.n_accepted(p uuid) RETURNS bigint
LANGUAGE sql AS $$ SELECT count(*) FROM public.accepted_presentations WHERE id = p $$;
CREATE FUNCTION pg_temp.n_rejected(p uuid) RETURNS bigint
LANGUAGE sql AS $$ SELECT count(*) FROM public.rejected_presentations WHERE id = p $$;

-- ===========================================================================
-- Scenario 1: ACCEPT happy path (3 orgs) — full participation, >=1 for, 0 against.
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111110002', 'for');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220001'), 0::bigint,
  'not accepted before all organizers have voted');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220001', '11111111-1111-1111-1111-111111110003', 'abstain');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220001'), 1::bigint,
  'accepted once all voted with >=1 for and 0 against (rest abstain)');
SELECT is(
  (SELECT year FROM public.accepted_presentations WHERE id = '22222222-2222-2222-2222-222222220001'),
  '2026'::public.summit_year, 'accepted row carries the submission year');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220001'), 0::bigint,
  'accepted submission is not also rejected');

-- ===========================================================================
-- Scenario 2: any 'against' blocks acceptance, and one against of three is not
-- enough to decline (3 orgs: for/for/against).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111110002', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220002', '11111111-1111-1111-1111-111111110003', 'against');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220002'), 0::bigint,
  'a single against blocks acceptance');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220002'), 0::bigint,
  'one against of three does not decline (2*1+0 not > 3)');

-- ===========================================================================
-- Scenario 3: DECLINE once a tie is unreachable (4 orgs: 2 against, 1 abstain,
-- 1 not voted -> 2*2+1 = 5 > 4).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003',
  '11111111-1111-1111-1111-111111110004']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220003', '11111111-1111-1111-1111-111111110001', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220003', '11111111-1111-1111-1111-111111110002', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220003', '11111111-1111-1111-1111-111111110003', 'abstain');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220003'), 1::bigint,
  'declined when a for/against tie can no longer be reached');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220003'), 0::bigint,
  'declined submission is not accepted');

-- ===========================================================================
-- Scenario 4: no decline while a tie is still reachable (4 orgs: 2 against,
-- 2 not voted -> 2*2+0 = 4, not > 4).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003',
  '11111111-1111-1111-1111-111111110004']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220004', '11111111-1111-1111-1111-111111110001', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220004', '11111111-1111-1111-1111-111111110002', 'against');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220004'), 0::bigint,
  'not declined while the remaining voters could still tie');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220004'), 0::bigint,
  'and not accepted');

-- ===========================================================================
-- Scenario 5: an exact for/against tie does nothing (4 orgs: 2 for, 2 against).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003',
  '11111111-1111-1111-1111-111111110004']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220005', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220005', '11111111-1111-1111-1111-111111110002', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220005', '11111111-1111-1111-1111-111111110003', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220005', '11111111-1111-1111-1111-111111110004', 'against');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220005'), 0::bigint,
  'a 2-2 for/against tie is not accepted');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220005'), 0::bigint,
  'a 2-2 for/against tie is not declined');

-- ===========================================================================
-- Scenario 6: odd organizer count needs strictly more than half against
-- (5 orgs: 2 against -> 4 not > 5; 3 against -> 6 > 5).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003',
  '11111111-1111-1111-1111-111111110004',
  '11111111-1111-1111-1111-111111110005']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220006', '11111111-1111-1111-1111-111111110001', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220006', '11111111-1111-1111-1111-111111110002', 'against');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220006'), 0::bigint,
  'two against of five does not decline');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220006', '11111111-1111-1111-1111-111111110003', 'against');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220006'), 1::bigint,
  'three against of five declines');

-- ===========================================================================
-- Scenario 7: one-directional / idempotent — changing a vote after acceptance
-- neither duplicates nor removes the outcome (3 orgs).
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220007', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220007', '11111111-1111-1111-1111-111111110002', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220007', '11111111-1111-1111-1111-111111110003', 'abstain');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220007'), 1::bigint,
  'accepted after full participation');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220007', '11111111-1111-1111-1111-111111110003', 'for');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220007'), 1::bigint,
  'changing a vote after acceptance leaves exactly one accepted row');

-- ===========================================================================
-- Scenario 8: changing a vote while under review re-evaluates (3 orgs). An
-- against keeps it under review; flipping it to abstain then accepts.
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220008', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220008', '11111111-1111-1111-1111-111111110002', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220008', '11111111-1111-1111-1111-111111110003', 'against');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220008'), 0::bigint,
  'under review while an against stands');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220008', '11111111-1111-1111-1111-111111110003', 'abstain');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220008'), 1::bigint,
  'accepted after the against is changed to abstain');

-- ===========================================================================
-- Scenario 9: votes are locked by RLS once an outcome exists, but allowed while
-- under review (3 orgs). p9 is declined; p10 stays under review.
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220009', '11111111-1111-1111-1111-111111110001', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220009', '11111111-1111-1111-1111-111111110002', 'against');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220009'), 1::bigint,
  'two against of three declines (precondition for the lock test)');
SELECT is(
  pg_temp.try_vote_as('11111111-1111-1111-1111-111111110003',
    '22222222-2222-2222-2222-222222220009', 'for'),
  false, 'an organizer cannot vote on a declined submission (RLS lock)');
SELECT is(
  pg_temp.try_vote_as('11111111-1111-1111-1111-111111110003',
    '22222222-2222-2222-2222-222222220010', 'for'),
  true, 'an organizer can vote on a submission still under review');

-- ===========================================================================
-- Scenario 10: removing a NON-voting organizer re-evaluates and ACCEPTS. The
-- removed organizer cast no vote, so nothing cascades and the per-row trigger
-- never fires; the statement-level organizers trigger is what re-tallies here.
-- (3 orgs: 1,2 vote 'for', 3 never votes -> under review; remove 3 -> 2 orgs,
-- both 'for', full participation, 0 against -> accept.)
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220011', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220011', '11111111-1111-1111-1111-111111110002', 'for');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220011'), 0::bigint,
  'under review while a non-voting organizer remains');
DELETE FROM public.organizers WHERE id = '11111111-1111-1111-1111-111111110003';
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220011'), 1::bigint,
  'removing the last non-voting organizer accepts the now-unanimous submission');

-- ===========================================================================
-- Scenario 11: removing a NON-voting organizer can also DECLINE once a tie
-- becomes unreachable. (4 orgs: 1,2 vote 'against', 3,4 never vote ->
-- 2*2+0 = 4, not > 4, under review; remove 4 -> 3 orgs, 2*2+0 = 4 > 3 -> decline.)
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003',
  '11111111-1111-1111-1111-111111110004']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220012', '11111111-1111-1111-1111-111111110001', 'against');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220012', '11111111-1111-1111-1111-111111110002', 'against');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220012'), 0::bigint,
  'under review while a tie is still reachable with four organizers');
DELETE FROM public.organizers WHERE id = '11111111-1111-1111-1111-111111110004';
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220012'), 1::bigint,
  'removing a non-voting organizer declines once a tie can no longer be reached');

-- ===========================================================================
-- Scenario 12: removing a VOTING organizer re-tallies via the FK cascade (the
-- per-row trigger fires on the cascade-deleted vote). Removing the lone dissenter
-- flips an otherwise-unanimous submission to accepted. (3 orgs: 1,2 'for',
-- 3 'against' -> under review; remove 3 -> their vote cascades away -> 2 orgs,
-- 2 'for', 0 against -> accept.)
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220013', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220013', '11111111-1111-1111-1111-111111110002', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220013', '11111111-1111-1111-1111-111111110003', 'against');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220013'), 0::bigint,
  'under review while the dissenting organizer is present');
DELETE FROM public.organizers WHERE id = '11111111-1111-1111-1111-111111110003';
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220013'), 1::bigint,
  'removing the dissenting organizer accepts via the cascade re-tally');

-- ===========================================================================
-- Scenario 13: ADDING an organizer is deliberately not hooked and must never
-- finalize a submission on its own — a larger roster only raises the bar. (3 orgs:
-- 1,2 vote 'for', 3 not voted -> under review; add a 4th organizer -> still
-- under review, no accept, no decline.)
-- ===========================================================================
SELECT pg_temp.reset_orgs(ARRAY[
  '11111111-1111-1111-1111-111111110001',
  '11111111-1111-1111-1111-111111110002',
  '11111111-1111-1111-1111-111111110003']::uuid[]);
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220014', '11111111-1111-1111-1111-111111110001', 'for');
SELECT pg_temp.vote('22222222-2222-2222-2222-222222220014', '11111111-1111-1111-1111-111111110002', 'for');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220014'), 0::bigint,
  'under review before the organizer is added');
INSERT INTO public.organizers (id) VALUES ('11111111-1111-1111-1111-111111110004');
SELECT is(pg_temp.n_accepted('22222222-2222-2222-2222-222222220014'), 0::bigint,
  'adding an organizer does not accept an under-review submission');
SELECT is(pg_temp.n_rejected('22222222-2222-2222-2222-222222220014'), 0::bigint,
  'adding an organizer does not decline an under-review submission');

SELECT * FROM finish();
ROLLBACK;

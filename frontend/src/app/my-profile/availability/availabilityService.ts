import 'server-only';

import { createServerClient } from '@/lib/supabaseServer';
import type { SummitYear } from '@/lib/databaseModels';
import { sessionInterval, type ScheduledSession } from './slots';

/**
 * The hours this account has already claimed for a year, as slot-start ISO
 * strings. Read under the user's own session, so RLS scopes it to them.
 */
export const listAvailability = async (
  userId: string,
  year: SummitYear
): Promise<string[]> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('presenter_availability')
    .select('slot_start')
    .eq('user_id', userId)
    .eq('year', year);

  if (error) {
    throw new Error(error.message);
  }
  // Postgres hands back its own timestamptz rendering ('2026-08-31 13:00:00+00'),
  // which is not the ISO form the slots are keyed by. Normalise on the way in so
  // a stored hour matches the slot it belongs to by string equality.
  return data.map((row) => new Date(row.slot_start).toISOString());
};

/**
 * Sessions this account is already scheduled to give, for the hours they cover.
 *
 * Co-presenters count: `presentation_presenters` holds a row per speaker, and a
 * co-presenter has to be there for the session just as much as the submitter.
 * Unscheduled acceptances are dropped — they lock nothing.
 */
export const listScheduledSessions = async (
  userId: string,
  year: SummitYear
): Promise<ScheduledSession[]> => {
  const supabase = await createServerClient();
  // The acceptance row hangs off the submission, not off this bridge table, so
  // the embed nests rather than sitting alongside. `!inner` on both makes them
  // joins rather than optional embeds, which is what lets the filters below
  // apply to the acceptance at all.
  const { data, error } = await supabase
    .from('presentation_presenters')
    .select(
      `presentation_id,
       presentation_submissions!inner(
         title,
         presentation_type,
         accepted_presentations!inner(scheduled_for, year)
       )`
    )
    .eq('presenter_id', userId)
    .eq('presentation_submissions.accepted_presentations.year', year)
    .not(
      'presentation_submissions.accepted_presentations.scheduled_for',
      'is',
      null
    );

  if (error) {
    throw new Error(error.message);
  }

  return data.flatMap((row) => {
    const submission = row.presentation_submissions;
    const scheduledFor = submission?.accepted_presentations?.scheduled_for;
    if (submission == null || scheduledFor == null) {
      return [];
    }
    return [
      {
        presentationId: row.presentation_id,
        title: submission.title,
        ...sessionInterval(scheduledFor, submission.presentation_type)
      }
    ];
  });
};

/**
 * The zone to render slot times in, by the agreed precedence: the account's
 * stored preference first, then whatever the browser reports, then UTC.
 *
 * Only the first step is knowable on the server — the browser's zone is not in
 * the request — so this returns null when no preference is stored and leaves the
 * client to fall through the rest. `timezone_preferences` currently has no UI
 * writing to it, so null is the normal case today.
 */
export const storedDisplayTimeZone = async (
  userId: string
): Promise<string | null> => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('timezone_preferences')
    .select('timezone_db')
    .eq('id', userId)
    .maybeSingle();

  if (error || data === null) {
    return null;
  }
  return data.timezone_db;
};

'use server';

import { createServerActionClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';
import { isSummitYear } from '@/lib/databaseModels';
import { revalidatePath } from 'next/cache';
import { listAvailability, listScheduledSessions } from './availabilityService';
import { buildSlots, lockedSlots } from './slots';

export type AvailabilityActionState = {
  error?: string;
  success?: boolean;
  /** The saved set, so the control can resynchronise with what actually landed. */
  slots: string[];
};

/**
 * Persist the hours a presenter has offered.
 *
 * The form posts the whole selection rather than a diff — the control is a set
 * of checkboxes, so the browser gives us the complete state for free, and a
 * whole-set post is idempotent in a way a diff replayed against changed rows is
 * not. The diffing happens here, against what is currently stored.
 */
export const saveAvailabilityAction = async (
  previousState: AvailabilityActionState,
  formData: FormData
): Promise<AvailabilityActionState> => {
  const user = await getUser();
  if (user === null) {
    return {
      error: 'You need to be signed in to set your availability.',
      success: false,
      slots: previousState.slots
    };
  }

  const year = formData.get('year');
  if (typeof year !== 'string' || !isSummitYear(year)) {
    return {
      error: 'That summit year is not one we run.',
      success: false,
      slots: previousState.slots
    };
  }

  // Only the 24 hours of this summit exist. Anything else is a forged or stale
  // post, and is dropped rather than rejected: a slot the grid no longer offers
  // is not something the user can see or correct.
  const slots = buildSlots(year);
  const offered = new Set(slots.map((slot) => slot.start));
  const submitted = new Set(
    formData
      .getAll('slot')
      .filter((value): value is string => typeof value === 'string')
      .map((value) => {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
      })
      .filter((value) => offered.has(value))
  );

  // An hour the organizers have already scheduled this presenter into is theirs
  // whatever the form says. Recomputed here rather than trusted from the post,
  // because the schedule can move between the page rendering and this save.
  const scheduled = await listScheduledSessions(user.id, year);
  for (const slotStart of lockedSlots(slots, scheduled).keys()) {
    submitted.add(slotStart);
  }

  const stored = new Set(await listAvailability(user.id, year));
  const toAdd = [...submitted].filter((slot) => !stored.has(slot));
  const toRemove = [...stored].filter((slot) => !submitted.has(slot));

  const supabase = await createServerActionClient();

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('presenter_availability')
      .delete()
      .eq('user_id', user.id)
      .eq('year', year)
      .in('slot_start', toRemove);
    if (error) {
      return { error: error.message, success: false, slots: previousState.slots };
    }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from('presenter_availability').insert(
      toAdd.map((slotStart) => ({
        user_id: user.id,
        year,
        slot_start: slotStart
      }))
    );
    if (error) {
      return { error: error.message, success: false, slots: previousState.slots };
    }
  }

  revalidatePath('/my-profile');
  return { error: undefined, success: true, slots: [...submitted].sort() };
};

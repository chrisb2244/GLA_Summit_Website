import { submissionsForYear } from '@/app/configConstants';
import { AvailabilityGrid, type LockedSlot } from './AvailabilityGrid';
import {
  hasSubmissionForYear,
  listAvailability,
  listScheduledSessions,
  storedDisplayTimeZone
} from './availabilityService';
import { buildSlots, lockedSlots } from './slots';

/**
 * Availability is collected for the summit submissions are currently open for —
 * that is the event still to be scheduled, and the one the answer is useful for.
 */
const availabilityYear = submissionsForYear;

export const AvailabilitySection = async ({ userId }: { userId: string }) => {
  // Only people with a presentation in the running are asked. An attendee has
  // no use for the question, and an empty answer from one would be noise in the
  // organizers' view of who is actually available.
  if (!(await hasSubmissionForYear(userId, availabilityYear))) {
    return null;
  }

  const slots = buildSlots(availabilityYear);

  const [selected, scheduled, storedTimeZone] = await Promise.all([
    listAvailability(userId, availabilityYear),
    listScheduledSessions(userId, availabilityYear),
    storedDisplayTimeZone(userId)
  ]);

  const locked: LockedSlot[] = [...lockedSlots(slots, scheduled)].map(
    ([slotStart, sessions]) => ({
      slotStart,
      titles: sessions.map((session) => session.title)
    })
  );

  return (
    <AvailabilityGrid
      year={availabilityYear}
      slots={slots}
      initialSelected={selected}
      locked={locked}
      storedTimeZone={storedTimeZone}
    />
  );
};

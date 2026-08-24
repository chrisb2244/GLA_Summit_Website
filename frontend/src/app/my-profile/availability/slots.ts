import { summitStartDates } from '@/app/configConstants';
import type { PresentationType, SummitYear } from '@/lib/databaseModels';
import { getSessionDurationInMinutes } from '@/lib/utils';

/**
 * The summit runs as one unbroken 24-hour block from 12:00 UTC on its start
 * date (see `summitStartDates`), so a presenter's availability is a subset of
 * exactly these 24 hours. Nothing outside the window is offerable, which is
 * what keeps the control a fixed-size grid rather than an open calendar.
 */
export const SLOTS_PER_SUMMIT = 24;

export const SLOT_DURATION_MS = 60 * 60 * 1000;

export type Slot = {
  /** UTC instant the hour begins, as the ISO-8601 string stored in the DB. */
  start: string;
  /** UTC instant the hour ends — the next slot's start. */
  end: string;
  /** 0-23, counting from the first hour of the summit. */
  index: number;
};

/**
 * A presentation this account is already scheduled to give. The slots it covers
 * are locked on: the presenter cannot claim to be unavailable for an hour the
 * organizers have already committed them to.
 */
export type ScheduledSession = {
  presentationId: string;
  title: string;
  /** UTC instant the session starts. */
  start: string;
  /** UTC instant the session ends. */
  end: string;
};

export const buildSlots = (year: SummitYear): Slot[] => {
  const summitStart = summitStartDates[year].getTime();
  return Array.from({ length: SLOTS_PER_SUMMIT }, (_, index) => ({
    start: new Date(summitStart + index * SLOT_DURATION_MS).toISOString(),
    end: new Date(summitStart + (index + 1) * SLOT_DURATION_MS).toISOString(),
    index
  }));
};

/**
 * Turn a scheduling row into the interval it occupies. Durations vary by
 * presentation type — a 7x7 is seven minutes, a panel a full hour — so the end
 * has to be derived rather than assumed.
 */
export const sessionInterval = (
  scheduledFor: string,
  type: PresentationType
): { start: string; end: string } => {
  const start = new Date(scheduledFor);
  const end = new Date(
    start.getTime() + getSessionDurationInMinutes(type) * 60 * 1000
  );
  return { start: start.toISOString(), end: end.toISOString() };
};

/**
 * Which slots each scheduled session covers, keyed by slot start.
 *
 * A session counts against every hour it overlaps, not just the one it starts
 * in: a 45-minute talk beginning at 12:30 needs the presenter present for part
 * of 13:00 too. Touching endpoints do not overlap — a session ending exactly at
 * 13:00 leaves 13:00 free.
 */
export const lockedSlots = (
  slots: Slot[],
  sessions: ScheduledSession[]
): Map<string, ScheduledSession[]> => {
  const locked = new Map<string, ScheduledSession[]>();
  for (const slot of slots) {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    const covering = sessions.filter((session) => {
      const sessionStart = new Date(session.start).getTime();
      const sessionEnd = new Date(session.end).getTime();
      return sessionStart < slotEnd && sessionEnd > slotStart;
    });
    if (covering.length > 0) {
      locked.set(slot.start, covering);
    }
  }
  return locked;
};

/**
 * Slot times rendered in one zone, e.g. `13:00–14:00`.
 *
 * `hourCycle: 'h23'` and the omitted locale match `TimestampSpan`, so an hour
 * reads the same here as it does on the presentation pages. The zone is always
 * passed explicitly: relying on the runtime default would render one way on the
 * server and another in the browser.
 *
 * The two ends are formatted separately rather than through `formatRange`.
 * `formatRange` widens to full dates as soon as the two instants fall on
 * different days — so the one hour that crosses local midnight would render as
 * `31/08/2026, 23:00 – 01/09/2026, 00:00` while its neighbours stayed `23:00 –
 * 00:00`, wrecking a grid whose whole point is that every cell is the same
 * shape. The date each cell belongs to is `formatSlotDay`'s job.
 */
export const formatSlotRange = (
  slot: Slot,
  timeZone: string,
  locale?: string
): string => {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const start = formatter.format(new Date(slot.start));
  const end = formatter.format(new Date(slot.end));
  return `${start}\u2013${end}`;
};

/**
 * The calendar day a slot falls on in a given zone, e.g. `Mon 31 Aug`. The
 * summit spans two dates everywhere, and in zones far from UTC the local date
 * turns over partway down the grid — without this, the two `03:00` rows a
 * presenter sees would be indistinguishable.
 */
export const formatSlotDay = (
  slot: Slot,
  timeZone: string,
  locale?: string
): string => {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(slot.start));
};

/** The short zone label, e.g. `GMT+9`, matching `TimestampSpan`'s `timeZoneName: 'short'`. */
export const timeZoneLabel = (
  timeZone: string,
  reference: Date,
  locale?: string
): string => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: 'short'
  }).formatToParts(reference);
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
};

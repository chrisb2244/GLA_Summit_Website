import type { AgendaEntryKind } from './AgendaCalculations';
import { agendaExtraLabels } from '@/app/agendaExtras';

/**
 * Which clock a time is rendered against.
 *
 * Used to avoid hydration mismatches.
 */
export type AgendaZone = 'utc' | 'local';

/**
 * Fixed locale for hydration matching (server/client renders).
 */
const FIXED_LOCALE = 'en-GB';

const localeFor = (zone: AgendaZone) =>
  zone === 'utc' ? FIXED_LOCALE : undefined;

const timeZoneFor = (zone: AgendaZone) => (zone === 'utc' ? 'UTC' : undefined);

const timeFormatter = (zone: AgendaZone) =>
  new Intl.DateTimeFormat(localeFor(zone), {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timeZoneFor(zone)
  });

export const formatAgendaTime = (date: Date, zone: AgendaZone) =>
  timeFormatter(zone).format(date);

export const formatAgendaTimeRange = (
  start: Date,
  end: Date,
  zone: AgendaZone
) => {
  const formatter = timeFormatter(zone);
  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

export const formatAgendaDate = (date: Date, zone: AgendaZone) =>
  new Intl.DateTimeFormat(localeFor(zone), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timeZoneFor(zone)
  }).format(date);

/** Calendar-day key for `date` on the clock `zone` names. */
const dayKey = (date: Date, zone: AgendaZone) =>
  zone === 'utc'
    ? date.toISOString().slice(0, 10)
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * True when `date` is the first of a series to land on a new calendar day in
 * `zone`.
 */
export const startsNewDay = (date: Date, previous: Date, zone: AgendaZone) =>
  dayKey(date, zone) !== dayKey(previous, zone);

/** Badge text for entries with no session page; `null` for ordinary sessions. */
export const kindLabel = (kind: AgendaEntryKind) =>
  kind === 'session' ? null : agendaExtraLabels[kind];

/**
 * The full entry description, used as the accessible name and the hover title.
 * The visible content is trimmed to fit the block, so this is the only place
 * that is guaranteed to carry everything.
 */
export const describeEntry = (
  entry: {
    title: string;
    speakers: string[];
    startTime: Date;
    endTime: Date;
    kind: AgendaEntryKind;
  },
  zone: AgendaZone
) => {
  const label = kindLabel(entry.kind);
  return [
    entry.title,
    label,
    entry.speakers.length > 0 ? entry.speakers.join(', ') : null,
    formatAgendaTimeRange(entry.startTime, entry.endTime, zone)
  ]
    .filter((part): part is string => part !== null && part !== '')
    .join('. ');
};

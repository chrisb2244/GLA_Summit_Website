import { getSessionDurationInMinutes } from '@/lib/utils';
import type { AgendaExtra } from '@/app/agendaExtras';
import type { PresentationSlot } from './AgendaCalculations';
import type { ScheduledAgendaEntry } from './Agenda';

const MINUTE = 60 * 1000;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

/**
 * Ids only have to be unique and stable within one render — nothing outside the
 * agenda resolves them — so a kind/start/title slug is enough, and it keeps
 * column assignment (which tiebreaks on id) reproducible across renders.
 */
export const agendaExtraId = (extra: AgendaExtra) =>
  `extra:${extra.kind}:${extra.start}:${slugify(extra.title)}`;

const linkForPresentation = (entry: ScheduledAgendaEntry) => {
  if (entry.presentation_type !== 'panel') {
    return `/presentations/${entry.presentation_id}`;
  }
  // ToDo - in a future year, fix this rather than being hardcoded
  const isOS = entry.title === 'How to make Open-Source more worthwhile?';
  return `/panels/${isOS ? 'open-source' : 'labview-and-python'}`;
};

const slotForPresentation = (
  entry: ScheduledAgendaEntry
): PresentationSlot => ({
  id: entry.presentation_id,
  title: entry.title,
  link: linkForPresentation(entry),
  kind: 'session',
  speakers: entry.all_presenters_names.filter((name) => name.trim() !== ''),
  startTime: new Date(entry.scheduled_for),
  durationMinutes: getSessionDurationInMinutes(entry.presentation_type),
  drawnDurationMinutes: getSessionDurationInMinutes(
    entry.presentation_type,
    'agenda-window'
  )
});

const slotForExtra = (extra: AgendaExtra): PresentationSlot => {
  const startTime = new Date(extra.start);
  const durationMinutes =
    (new Date(extra.end).getTime() - startTime.getTime()) / MINUTE;

  return {
    id: agendaExtraId(extra),
    title: extra.title,
    // No submission behind it, so no session page to link to.
    link: null,
    kind: extra.kind,
    speakers: extra.speakers,
    startTime,
    // Explicit start/end, so there is nothing to round up.
    durationMinutes,
    drawnDurationMinutes: durationMinutes
  };
};

/**
 * The agenda draws two kinds of thing: accepted submissions from the database,
 * and the fixed schedule items that have no submission (welcome, keynotes, NI
 * Expert Bar). Flattening both into one slot list up front means the layout code
 * never has to care which is which — only the renderer does, to decide whether
 * the block is a link.
 */
export const buildAgendaSlots = (
  presentations: ScheduledAgendaEntry[],
  extras: AgendaExtra[]
): PresentationSlot[] => [
  ...presentations.map(slotForPresentation),
  ...extras.map(slotForExtra)
];

'use client';

import Link from 'next/link';
import { ListCard } from '@/Components/Layout/ListCard';
import type { PresentationSlot } from './AgendaCalculations';
import {
  formatAgendaDate,
  formatAgendaTimeRange,
  kindLabel,
  type AgendaZone
} from './agendaFormatting';
import { useIsHydrated } from '@/Components/Utilities/useIsHydrated';

const MINUTE = 60 * 1000;

export type AgendaListProps = {
  slots: PresentationSlot[];
  favourites?: string[];
};

const endOf = (slot: PresentationSlot) =>
  new Date(slot.startTime.getTime() + slot.durationMinutes * MINUTE);

const durationLabel = (minutes: number) => {
  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${minutes} minutes`;
};

/**
 * The same schedule as a linear list.
 *
 * The timeline is 2880px tall and needs horizontal room for parallel sessions,
 * neither of which a phone has. This is the default below `md`, and the escape
 * hatch on any screen.
 */
export const AgendaList = (props: AgendaListProps) => {
  // Day headers are structural — a group either carries one or it does not —
  // so the boundaries have to fall in the same places on both sides of
  // hydration. Grouping by UTC day until then does that; the commit after
  // hydration regroups against the viewer's own calendar.
  const zone: AgendaZone = useIsHydrated() ? 'local' : 'utc';

  const sorted = [...props.slots].sort(
    (a, b) =>
      a.startTime.getTime() - b.startTime.getTime() ||
      (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
  );

  // Group by start time so parallel sessions read as alternatives rather than
  // as a sequence.
  const groups: { startTime: Date; entries: PresentationSlot[] }[] = [];
  for (const slot of sorted) {
    const last = groups.at(-1);
    if (last && last.startTime.getTime() === slot.startTime.getTime()) {
      last.entries.push(slot);
    } else {
      groups.push({ startTime: slot.startTime, entries: [slot] });
    }
  }

  if (groups.length === 0) {
    return null;
  }

  let previousDay: string | null = null;

  return (
    <div className='flex flex-col space-y-4'>
      {groups.map((group) => {
        const day = formatAgendaDate(group.startTime, zone);
        const startsNewDay = day !== previousDay;
        previousDay = day;

        return (
          <section key={group.startTime.getTime()}>
            {startsNewDay && (
              <h2 className='border-primaryc mb-2 border-b-2 text-lg font-semibold'>
                {day}
              </h2>
            )}
            <div className='flex flex-col space-y-2'>
              {group.entries.map((slot) => {
                const endTime = endOf(slot);
                const badge = kindLabel(slot.kind);
                const speakerLine = slot.speakers.join(', ');
                const favourite = props.favourites?.includes(slot.id)
                  ? ' favourite-session'
                  : '';

                return (
                  <ListCard
                    key={slot.id}
                    className={`flex flex-col${favourite}`}
                  >
                    <div className='flex flex-wrap items-baseline gap-x-2'>
                      {slot.link === null ? (
                        <span className='font-medium'>{slot.title}</span>
                      ) : (
                        <Link href={slot.link} className='link font-medium'>
                          {slot.title}
                        </Link>
                      )}
                      {badge !== null && (
                        <span className='border-secondaryc text-primaryc border px-1 text-[0.65rem] font-semibold tracking-wide uppercase'>
                          {badge}
                        </span>
                      )}
                    </div>
                    {speakerLine !== '' && (
                      <span className='italic'>{speakerLine}</span>
                    )}
                    <span className='text-sm italic'>
                      {formatAgendaTimeRange(slot.startTime, endTime, zone)} ·{' '}
                      {durationLabel(slot.durationMinutes)}
                    </span>
                  </ListCard>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

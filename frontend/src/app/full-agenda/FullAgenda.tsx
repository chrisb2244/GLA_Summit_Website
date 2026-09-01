'use client';

import { useMemo } from 'react';
import { Agenda, type ScheduledAgendaEntry } from '@/Components/Agenda/Agenda';
import { AgendaList } from '@/Components/Agenda/AgendaList';
import { buildAgendaSlots } from '@/Components/Agenda/agendaSlots';
import type { ContainerHint } from '@/Components/Agenda/AgendaCalculations';
import type { AgendaExtra } from '@/app/agendaExtras';
import { useFavouriteIds } from './useFavouriteIds';
import { startDate } from '../configConstants';
import { useViewType } from './useViewType';

const SHOW_FAVOURITES = false;

const toggleClasses = (active: boolean) =>
  `border-2 border-primaryc px-3 py-1 text-sm ${
    active ? 'bg-primaryc text-white' : 'bg-white text-primaryc'
  }`;

export const FullAgenda = (props: {
  fullAgenda: ScheduledAgendaEntry[];
  containerHints: ContainerHint[];
  extras: AgendaExtra[];
}) => {
  const { fullAgenda, containerHints, extras } = props;

  const slots = useMemo(
    () => buildAgendaSlots(fullAgenda, extras),
    [fullAgenda, extras]
  );

  const favouriteIds = useFavouriteIds(SHOW_FAVOURITES);

  const { shownView, setChosenView, visibility } = useViewType();

  // `#presentations` is the readiness hook for playwright/accessibility.spec.ts,
  // so it has to live on content inside the page's Suspense boundary: on the
  // wrapper outside it, it resolved before the agenda had streamed in.
  if (slots.length === 0) {
    return (
      <div id='presentations'>
        <p>
          This year&apos;s agenda has not been published yet. Please check back
          soon.
        </p>
      </div>
    );
  }

  return (
    <div id='presentations'>
      <div className='mb-2 flex items-center gap-2'>
        <span className='sr-only' id='agenda-view-label'>
          Agenda view
        </span>
        <div role='group' aria-labelledby='agenda-view-label' className='flex'>
          <button
            type='button'
            className={toggleClasses(shownView === 'timeline')}
            aria-pressed={shownView === 'timeline'}
            onClick={() => setChosenView('timeline')}
          >
            Timeline
          </button>
          <button
            type='button'
            className={toggleClasses(shownView === 'list')}
            aria-pressed={shownView === 'list'}
            onClick={() => setChosenView('list')}
          >
            List
          </button>
        </div>
      </div>

      <div className={visibility('timeline')}>
        <Agenda
          slots={slots}
          startDate={startDate}
          durationInHours={24}
          favourites={favouriteIds}
          containerHints={containerHints}
        />
      </div>
      <div className={visibility('list')}>
        <AgendaList slots={slots} favourites={favouriteIds} />
      </div>
    </div>
  );
};

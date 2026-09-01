'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import type { ContainerHint, PresentationSlot } from './AgendaCalculations';
import { AgendaEntries } from './AgendaEntries';
import { TimeMarkers } from './TimeMarkers';
import { formatAgendaDate, type AgendaZone } from './agendaFormatting';
import { useIsHydrated } from '@/Components/Utilities/useIsHydrated';
import type { PresentationModel } from '@/lib/databaseModels';

export type ScheduledAgendaEntry = {
  [P in keyof PresentationModel]: NonNullable<PresentationModel[P]>;
};

export type AgendaProps = {
  slots: PresentationSlot[];
  startDate: Date;
  durationInHours?: number;
  favourites?: string[];
  containerHints?: ContainerHint[];
};

const MINUTE = 60 * 1000;

/** Vertical scale of the timeline. The one dial for how tall the page gets. */
const PIXELS_PER_MINUTE = 2;

/** How often the now-line moves. Also how stale the "jump to now" target can be. */
const NOW_TICK_MS = 30 * 1000;

/**
 * The day header reads its position from the DOM rather than from React state,
 * so `useSyncExternalStore` is the right hook: the scroll position is an
 * external store, and reading it during render avoids the cascading re-render
 * that a scroll listener writing state would cause.
 */
const subscribeToViewport = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
};

export const Agenda = (props: AgendaProps) => {
  const durationInHours = props.durationInHours
    ? Math.round(props.durationInHours)
    : 24;
  const totalMinutes = durationInHours * 60;
  const startCount = props.startDate.getTime();
  const endCount = startCount + totalMinutes * MINUTE;

  // Times render against UTC until hydration is done and can safely switch to
  // the viewer's own clock. See `useIsHydrated`.
  const hydrated = useIsHydrated();
  const zone: AgendaZone = hydrated ? 'local' : 'utc';

  const columnRef = useRef<HTMLDivElement | null>(null);
  const nowLineRef = useRef<HTMLDivElement | null>(null);
  const dayHeaderRef = useRef<HTMLDivElement | null>(null);

  // Ticks so the now-line moves without a reload. Unlike before, the value is
  // actually rendered — the line it was added for had been commented out.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(
      () => startTransition(() => setNow(new Date())),
      NOW_TICK_MS
    );
    return () => clearInterval(interval);
  }, []);

  const nowCount = now.getTime();
  const nowOffsetPx = ((nowCount - startCount) / MINUTE) * PIXELS_PER_MINUTE;

  // Nothing clock-derived is rendered until hydration is over: the offset below
  // is the wall clock scaled to sub-pixel precision, so a server-rendered line
  // never agrees with the client's to the digit, and on the window's edges the
  // two sides disagree about whether the line exists at all.
  const nowIsInWindow =
    hydrated && nowCount >= startCount && nowCount <= endCount;

  // Which day the viewer is currently looking at. The window is 24 hours from
  // noon UTC, so it straddles local midnight for nearly everyone and the hour
  // labels alone do not say which day they belong to.
  //
  // Rounding to whole minutes keeps the snapshot stable for a given scroll
  // position, which is what `useSyncExternalStore` requires.
  const visibleCount = useSyncExternalStore(
    subscribeToViewport,
    () => {
      const column = columnRef.current;
      if (!column) return startCount;
      const { top, height } = column.getBoundingClientRect();
      const boundary =
        dayHeaderRef.current?.getBoundingClientRect().bottom ?? 0;
      const scrolledPx = Math.min(Math.max(boundary - top, 0), height);
      return startCount + Math.round(scrolledPx / PIXELS_PER_MINUTE) * MINUTE;
    },
    () => startCount
  );

  const jumpToNow = useCallback((behavior: ScrollBehavior) => {
    nowLineRef.current?.scrollIntoView({ block: 'center', behavior });
  }, []);

  // While the summit is actually running, open on the current session rather
  // than on noon UTC. Only once, and only when there is a now-line to find.
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    if (hasAutoScrolled.current || !nowIsInWindow) return;
    hasAutoScrolled.current = true;
    jumpToNow('auto');
  }, [nowIsInWindow, jumpToNow]);

  return (
    <>
      <div
        ref={dayHeaderRef}
        className='border-primaryc sticky top-(--menu-bar-height) z-20 mb-1 flex items-center justify-between gap-2 border-b-2 bg-white px-2 py-1'
      >
        <span className='font-semibold'>
          {formatAgendaDate(new Date(visibleCount), zone)}
        </span>
        {nowIsInWindow && (
          <button
            type='button'
            className='link text-sm'
            onClick={() => jumpToNow('smooth')}
          >
            Jump to now
          </button>
        )}
      </div>

      <div
        className='border-primaryc relative mb-5 box-content flex w-full border-2 py-4'
        style={{ height: `${totalMinutes * PIXELS_PER_MINUTE}px` }}
      >
        <div className='relative w-[6ch] shrink-0'>
          <TimeMarkers
            startDate={props.startDate}
            durationInHours={durationInHours}
            pixelsPerMinute={PIXELS_PER_MINUTE}
            zone={zone}
          />
        </div>
        <div className='relative box-border grow' ref={columnRef}>
          {/* Hour rules, so a block's position is readable without tracking
              back to the gutter across an empty stretch. Rendered before the
              blocks so they paint underneath. */}
          {Array.from({ length: durationInHours + 1 }, (_unused, hour) => (
            <div
              key={hour}
              aria-hidden='true'
              className='pointer-events-none absolute left-0 w-full border-t border-gray-200'
              style={{ top: `${hour * 60 * PIXELS_PER_MINUTE}px` }}
            />
          ))}
          <AgendaEntries
            slots={props.slots}
            pixelsPerMinute={PIXELS_PER_MINUTE}
            start={props.startDate}
            windowEnd={new Date(endCount)}
            favourites={props.favourites}
            containerHints={props.containerHints}
            zone={zone}
          />
          {nowIsInWindow && (
            <div
              ref={nowLineRef}
              aria-hidden='true'
              className='pointer-events-none absolute z-10 h-0 border-t-2 border-dashed border-red-600'
              style={{
                top: `${nowOffsetPx}px`,
                left: '-6ch',
                width: 'calc(100% + 6ch)'
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

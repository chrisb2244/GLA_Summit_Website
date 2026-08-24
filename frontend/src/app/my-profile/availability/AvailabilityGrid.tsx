'use client';

import { useActionState, useMemo, useState } from 'react';
import { mdiLock } from '@mdi/js';
import Icon from '@mdi/react';
import { Button } from '@/Components/Form/Button';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import type { SummitYear } from '@/lib/databaseModels';
import {
  saveAvailabilityAction,
  type AvailabilityActionState
} from './availabilityActions';
import {
  formatSlotDay,
  formatSlotRange,
  timeZoneLabel,
  type Slot
} from './slots';
import { useSlotPainter } from './useSlotPainter';

/** A slot the presenter is already scheduled into, flattened for the client. */
export type LockedSlot = {
  slotStart: string;
  titles: string[];
};

export type AvailabilityGridProps = {
  year: SummitYear;
  slots: Slot[];
  initialSelected: string[];
  locked: LockedSlot[];
  /**
   * The account's stored display zone, or null if it has none. The browser's own
   * zone is the next fallback, and UTC the last.
   */
  storedTimeZone: string | null;
};

/**
 * The zone to render local times in: the account's stored preference, else
 * whatever the browser reports, else UTC.
 *
 * On the server the middle step yields the *server's* zone rather than the
 * viewer's, so every string derived from it is marked `suppressHydrationWarning`
 * and settles on the first client render — the same bargain `TimestampSpan`
 * makes, and the reason each cell's variable text is a single text node.
 */
const resolveTimeZone = (storedTimeZone: string | null): string => {
  if (storedTimeZone !== null) {
    return storedTimeZone;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const sameMembers = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((key) => b.has(key));

/** Consecutive selected hours collapsed into ranges, for the summary line. */
const contiguousRuns = (slots: Slot[], selected: ReadonlySet<string>) => {
  const runs: { start: Slot; end: Slot }[] = [];
  for (const slot of slots) {
    if (!selected.has(slot.start)) {
      continue;
    }
    const previous = runs.at(-1);
    if (previous !== undefined && previous.end.index === slot.index - 1) {
      previous.end = slot;
    } else {
      runs.push({ start: slot, end: slot });
    }
  }
  return runs;
};

export const AvailabilityGrid = (props: AvailabilityGridProps) => {
  const { year, slots, initialSelected, locked, storedTimeZone } = props;

  const lockedByStart = useMemo(
    () => new Map(locked.map((entry) => [entry.slotStart, entry.titles])),
    [locked]
  );
  const lockedKeys = useMemo(
    () => new Set(lockedByStart.keys()),
    [lockedByStart]
  );
  const slotKeys = useMemo(() => slots.map((slot) => slot.start), [slots]);

  const [state, formAction] = useActionState<AvailabilityActionState, FormData>(
    saveAvailabilityAction,
    {
      error: undefined,
      success: undefined,
      slots: [...new Set([...initialSelected, ...lockedKeys])]
    }
  );

  // What the server currently holds. A save returns the set that actually
  // landed, so this follows the action rather than being copied into state.
  const savedSelection = useMemo(
    () => new Set([...state.slots, ...lockedKeys]),
    [state.slots, lockedKeys]
  );

  // Unsaved edits, or null when the grid is showing exactly what was saved.
  const [edited, setEdited] = useState<ReadonlySet<string> | null>(null);

  // A successful save makes the edits redundant: drop them so the grid falls
  // back to what the server returned. Adjusting state during render (rather than
  // in an effect) is React's own recommendation for reacting to a changed
  // input — it re-renders before anything is painted, with no cascading commit.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.success) {
      setEdited(null);
    }
  }

  const selected = edited ?? savedSelection;
  const isDirty = edited !== null && !sameMembers(edited, savedSelection);

  const { isPainting, onCellPointerDown, onGridClickCapture } = useSlotPainter({
    slotKeys,
    lockedKeys,
    selected,
    onChange: setEdited
  });

  const displayTimeZone = resolveTimeZone(storedTimeZone);
  const zoneIsUtc = displayTimeZone === 'UTC';
  const localLabel = timeZoneLabel(displayTimeZone, new Date(slots[0].start));

  const zoneNote = `Local times shown in ${displayTimeZone.replace(/_/g, ' ')}${
    storedTimeZone === null
      ? ' — taken from your browser'
      : ' — your saved preference'
  }`;

  const runs = contiguousRuns(slots, selected);
  const summary =
    runs.length === 0
      ? null
      : `Offering ${selected.size} hour${selected.size === 1 ? '' : 's'}: ` +
        runs
          .map((run) =>
            formatSlotRange({ ...run.start, end: run.end.end }, displayTimeZone)
          )
          .join(', ') +
        (zoneIsUtc ? ' UTC' : ` ${localLabel}`);

  // Locked hours survive either bulk action: they are not the presenter's to
  // give up, and offering them again is a no-op.
  const setAll = (next: boolean) =>
    setEdited(next ? new Set(slotKeys) : new Set(lockedKeys));

  return (
    <form action={formAction} className='mt-8 px-4'>
      <input type='hidden' name='year' value={year} />

      <h2 className='text-xl font-semibold'>When can you present?</h2>
      <p className='mt-1 text-sm text-gray-600'>
        The summit runs for 24 hours without a break, so every presenter is
        asked which of those hours they could take a session in. Offer anything
        you could make work — the more hours there are to choose from, the
        easier the schedule is to build around everyone else.
      </p>
      <p className='mt-1 text-sm text-gray-600'>
        Tap an hour to turn it on or off. To pick several at once, drag across
        them with a mouse, or press and hold one and then drag.
      </p>
      <p className='mt-1 text-sm text-gray-500' suppressHydrationWarning>
        {zoneNote}
      </p>

      {/*
        Column-major, with the breakpoint changing the row count rather than the
        column count: hours run *down* each column, so the columns split the day
        into consecutive blocks and a downward drag sweeps consecutive hours. In
        a row-major grid the same drag would jump across the day and back, which
        is not what the gesture looks like it is doing. One column on a narrow
        phone, then two, three and four as there is width for them.
      */}
      <div
        onClickCapture={onGridClickCapture}
        className={`mt-3 grid grid-flow-col grid-rows-24 gap-2 select-none sm:grid-rows-12 md:grid-rows-8 lg:grid-rows-6 ${
          isPainting ? 'cursor-grabbing' : ''
        }`}
      >
        {slots.map((slot) => {
          const lockedTitles = lockedByStart.get(slot.start);
          const isLocked = lockedTitles !== undefined;
          const isSelected = selected.has(slot.start);

          // One text node each: the zone these depend on differs between the
          // server render and the first client render (see resolveTimeZone).
          const localLine = zoneIsUtc
            ? ''
            : `${formatSlotRange(slot, displayTimeZone)} ${localLabel}`;
          const dayLine = formatSlotDay(slot, displayTimeZone);

          return (
            <label
              key={slot.start}
              data-slot-index={slot.index}
              onPointerDown={(event) => onCellPointerDown(slot.index, event)}
              // Vertical panning stays with the page: the hold is what hands the
              // gesture to the grid, not merely touching a cell.
              style={{ touchAction: 'pan-y' }}
              className={`flex min-h-16 flex-col justify-center rounded-md border px-3 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-secondaryc ${
                isLocked
                  ? // Locked hours are offered, so they carry the selected fill;
                    // the dashed edge and the padlock are what say "and not
                    // yours to withdraw". A lighter fill would read as *un*
                    // selected sitting between two painted neighbours.
                    'cursor-not-allowed border-dashed border-primaryc bg-primaryc/25'
                  : isSelected
                    ? 'cursor-pointer border-primaryc bg-primaryc/25 hover:bg-primaryc/30'
                    : 'cursor-pointer border-gray-300 bg-white hover:bg-gray-100'
              }`}
            >
              <input
                type='checkbox'
                name='slot'
                value={slot.start}
                checked={isSelected}
                disabled={isLocked}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) {
                    next.add(slot.start);
                  } else {
                    next.delete(slot.start);
                  }
                  setEdited(next);
                }}
                className='sr-only'
              />

              <span className='font-medium tabular-nums'>
                {`${formatSlotRange(slot, 'UTC')} UTC`}
              </span>
              <span className='tabular-nums italic' suppressHydrationWarning>
                {localLine}
              </span>
              <span className='text-xs text-gray-500' suppressHydrationWarning>
                {dayLine}
              </span>

              {isLocked ? (
                <span className='mt-1 flex items-start gap-1 text-xs font-medium text-primaryc'>
                  <Icon path={mdiLock} size={0.6} className='shrink-0' />
                  {`Scheduled: ${lockedTitles.join(', ')}`}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        <Button type='button' onClick={() => setAll(true)}>
          Select all 24 hours
        </Button>
        <Button type='button' onClick={() => setAll(false)}>
          Clear
        </Button>
      </div>

      <div className='mt-3 text-sm' aria-live='polite'>
        {summary === null ? (
          <p className='text-gray-600'>
            No hours offered yet — an empty answer reads as &ldquo;not
            stated&rdquo;, not as &ldquo;any time&rdquo;.
          </p>
        ) : (
          <p className='text-gray-700' suppressHydrationWarning>
            {summary}
          </p>
        )}
      </div>

      {state.error === undefined ? null : (
        <p className='mt-2 text-sm text-red-700'>{state.error}</p>
      )}
      {state.success && !isDirty ? (
        <p className='mt-2 text-sm text-green-700'>Availability saved.</p>
      ) : null}

      <div className='mt-3'>
        <SubmitButton
          pendingText='Saving availability...'
          staticText='Save availability'
          fullWidth
          disabled={!isDirty}
        />
      </div>
    </form>
  );
};

'use client';

import { useIsHydrated } from './useIsHydrated';

type TimeValue = string | null | { start: string; end: string };
type DateDisplay = {
  year?: 'numeric' | '2-digit' | undefined;
  month?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow' | undefined;
  day?: 'numeric' | '2-digit' | undefined;
};

type TimestampSpanProps = {
  utcValue: TimeValue;
  displayUTC?: boolean;
  use12Hour?: boolean;
  dateFormat?: DateDisplay;
};

/**
 * Which clock a time is rendered against.
 *
 * - `utc`: the server render (and therefore any prerendered/cached shell) and
 *   the client's hydration render. Pinned to UTC + `en-GB` so the text is
 *   identical whichever machine, timezone, or ICU build produced it.
 * - `local`: every client render after hydration, in the viewer's own
 *   timezone and locale.
 */
export type TimestampZone = 'utc' | 'local';

const FIXED_LOCALE = 'en-GB';

type FormatOptions = Pick<TimestampSpanProps, 'use12Hour' | 'dateFormat'>;

const timeOptions = (
  use12Hour: boolean | undefined
): Intl.DateTimeFormatOptions => ({
  hour: '2-digit',
  minute: '2-digit',
  hour12: use12Hour,
  hourCycle: 'h23'
});

const hasDate = (dateFormat: DateDisplay | undefined) =>
  !!dateFormat && Object.values(dateFormat).some((v) => v !== undefined);

/**
 * Deterministic UTC text. Built from separate date and time parts joined by
 * hand, because the composite patterns differ between ICU versions (Node vs
 * Chromium vs Firefox): `formatRange`'s separator (thin space vs space), and
 * en-GB's date-time joiner (", " vs " at "). Either would be a hydration
 * mismatch.
 */
const formatUtc = (value: Exclude<TimeValue, null>, opts: FormatOptions) => {
  const time = (withZone: boolean) =>
    new Intl.DateTimeFormat(FIXED_LOCALE, {
      ...timeOptions(opts.use12Hour),
      timeZone: 'UTC',
      timeZoneName: withZone ? 'short' : undefined
    });
  const date = (d: Date) =>
    hasDate(opts.dateFormat)
      ? new Intl.DateTimeFormat(FIXED_LOCALE, {
          ...opts.dateFormat,
          timeZone: 'UTC'
        }).format(d) + ', '
      : '';

  if (typeof value === 'object') {
    const start = new Date(value.start);
    const end = new Date(value.end);
    const sameDay =
      start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);
    return sameDay
      ? `${date(start)}${time(false).format(start)} – ${time(true).format(end)}`
      : `${date(start)}${time(false).format(start)} – ${date(end)}${time(true).format(end)}`;
  }
  const d = new Date(value);
  return `${date(d)}${time(true).format(d)}`;
};

/** Viewer-local text. Client-only, so ICU-specific patterns are fine here. */
const formatLocal = (value: Exclude<TimeValue, null>, opts: FormatOptions) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    ...timeOptions(opts.use12Hour),
    ...opts.dateFormat,
    timeZoneName: 'short'
  });
  return typeof value === 'object'
    ? formatter.formatRange(new Date(value.start), new Date(value.end))
    : formatter.format(new Date(value));
};

export const formatTimestamp = (
  value: TimeValue,
  zone: TimestampZone,
  opts: FormatOptions = {}
) => {
  if (value === null) return '';
  return zone === 'utc' ? formatUtc(value, opts) : formatLocal(value, opts);
};

export const TimestampSpan = (props: TimestampSpanProps) => {
  const { utcValue, displayUTC, use12Hour, dateFormat } = props;
  const zone: TimestampZone = useIsHydrated() ? 'local' : 'utc';
  const opts = { use12Hour, dateFormat };

  const viewerIsUtc =
    zone === 'utc' ||
    Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC';
  const iso =
    utcValue === null
      ? undefined
      : typeof utcValue === 'object'
        ? utcValue.start
        : utcValue;

  return (
    // `data-zone` exposes which render is on screen, so tests can assert the
    // server/hydration text and the post-hydration local text separately.
    <span className='flex flex-col italic' data-zone={zone}>
      <time dateTime={iso}>{formatTimestamp(utcValue, zone, opts)}</time>
      {displayUTC && !viewerIsUtc ? (
        <time dateTime={iso}>{formatTimestamp(utcValue, 'utc', opts)}</time>
      ) : null}
    </span>
  );
};

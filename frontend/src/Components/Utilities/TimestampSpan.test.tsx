import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { formatTimestamp, TimestampSpan } from './TimestampSpan';

afterEach(cleanup);

const START = '2024-03-26T02:00:00+00:00';
const END = '2024-03-26T02:45:00+00:00';

describe('formatTimestamp (utc zone)', () => {
  // The utc zone is what the server/prerender emits and what hydration must
  // reproduce, so it has to be fixed text — independent of the process TZ.
  it('formats a single time with the zone name', () => {
    expect(formatTimestamp(START, 'utc')).toBe('02:00 UTC');
  });

  it('joins a same-day range by hand with one zone name', () => {
    expect(
      formatTimestamp({ start: START, end: END }, 'utc', {
        dateFormat: { day: '2-digit', month: 'long', year: 'numeric' }
      })
    ).toBe('26 March 2024, 02:00 – 02:45 UTC');
  });

  it('repeats the date for a range crossing midnight UTC', () => {
    expect(
      formatTimestamp(
        { start: '2024-03-25T23:30:00Z', end: '2024-03-26T00:15:00Z' },
        'utc',
        { dateFormat: { day: '2-digit', month: 'short' } }
      )
    ).toBe('25 Mar, 23:30 – 26 Mar, 00:15 UTC');
  });

  it('renders nothing for a null value', () => {
    expect(formatTimestamp(null, 'utc')).toBe('');
  });
});

describe('TimestampSpan', () => {
  it('server-renders the utc zone', () => {
    const html = renderToString(<TimestampSpan utcValue={START} />);
    expect(html).toContain('data-zone="utc"');
    expect(html).toContain('02:00 UTC');
  });

  it('renders the local zone on the client after hydration', () => {
    const { container } = render(<TimestampSpan utcValue={START} />);
    const span = container.querySelector('[data-zone]');
    expect(span?.getAttribute('data-zone')).toBe('local');
    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe(
      START
    );
  });
});

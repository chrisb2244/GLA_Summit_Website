import { describe, it, expect } from 'vitest';
import {
  SLOTS_PER_SUMMIT,
  buildSlots,
  formatSlotDay,
  formatSlotRange,
  lockedSlots,
  sessionInterval,
  timeZoneLabel,
  type ScheduledSession
} from './slots';

const session = (
  start: string,
  end: string,
  title = 'A talk'
): ScheduledSession => ({
  presentationId: 'p1',
  title,
  start,
  end
});

describe('buildSlots', () => {
  it('covers the summit as 24 back-to-back hours from 12:00 UTC', () => {
    const slots = buildSlots('2026');
    expect(slots).toHaveLength(SLOTS_PER_SUMMIT);
    expect(slots[0].start).toBe('2026-08-31T12:00:00.000Z');
    expect(slots[23].end).toBe('2026-09-01T12:00:00.000Z');
  });

  it('leaves no gap or overlap between consecutive slots', () => {
    const slots = buildSlots('2026');
    for (let index = 1; index < slots.length; index++) {
      expect(slots[index].start).toBe(slots[index - 1].end);
    }
  });

  it('starts each historic summit at its own date', () => {
    expect(buildSlots('2025')[0].start).toBe('2025-06-23T12:00:00.000Z');
    expect(buildSlots('2020')[0].start).toBe('2020-11-09T12:00:00.000Z');
  });
});

describe('sessionInterval', () => {
  it('derives the end from the presentation type, not a fixed hour', () => {
    expect(sessionInterval('2026-08-31T13:00:00Z', '7x7')).toEqual({
      start: '2026-08-31T13:00:00.000Z',
      end: '2026-08-31T13:07:00.000Z'
    });
    expect(sessionInterval('2026-08-31T13:00:00Z', 'full length')).toEqual({
      start: '2026-08-31T13:00:00.000Z',
      end: '2026-08-31T13:45:00.000Z'
    });
    expect(sessionInterval('2026-08-31T13:00:00Z', 'panel')).toEqual({
      start: '2026-08-31T13:00:00.000Z',
      end: '2026-08-31T14:00:00.000Z'
    });
  });
});

describe('lockedSlots', () => {
  const slots = buildSlots('2026');

  it('locks the hour a session sits inside', () => {
    const locked = lockedSlots(slots, [
      session('2026-08-31T13:10:00.000Z', '2026-08-31T13:55:00.000Z')
    ]);
    expect([...locked.keys()]).toEqual(['2026-08-31T13:00:00.000Z']);
  });

  it('locks every hour a session spills into', () => {
    const locked = lockedSlots(slots, [
      session('2026-08-31T13:30:00.000Z', '2026-08-31T14:15:00.000Z')
    ]);
    expect([...locked.keys()]).toEqual([
      '2026-08-31T13:00:00.000Z',
      '2026-08-31T14:00:00.000Z'
    ]);
  });

  it('does not lock an hour a session merely touches', () => {
    const locked = lockedSlots(slots, [
      session('2026-08-31T13:00:00.000Z', '2026-08-31T14:00:00.000Z')
    ]);
    expect([...locked.keys()]).toEqual(['2026-08-31T13:00:00.000Z']);
  });

  it('reports every session covering the same hour', () => {
    const locked = lockedSlots(slots, [
      session('2026-08-31T13:00:00.000Z', '2026-08-31T13:07:00.000Z', 'First'),
      session('2026-08-31T13:20:00.000Z', '2026-08-31T13:27:00.000Z', 'Second')
    ]);
    expect(
      locked.get('2026-08-31T13:00:00.000Z')?.map((entry) => entry.title)
    ).toEqual(['First', 'Second']);
  });

  it('ignores sessions scheduled outside the summit window', () => {
    const locked = lockedSlots(slots, [
      session('2026-08-30T13:00:00.000Z', '2026-08-30T14:00:00.000Z')
    ]);
    expect(locked.size).toBe(0);
  });

  it('locks nothing when nothing is scheduled', () => {
    expect(lockedSlots(slots, []).size).toBe(0);
  });
});

describe('formatting', () => {
  const slots = buildSlots('2026');

  it('renders an hour in UTC on a 24-hour clock', () => {
    expect(formatSlotRange(slots[0], 'UTC', 'en-GB')).toBe('12:00–13:00');
  });

  it('renders the same hour shifted into another zone', () => {
    // 12:00 UTC is 21:00 the same day in Tokyo.
    expect(formatSlotRange(slots[0], 'Asia/Tokyo', 'en-GB')).toBe(
      '21:00–22:00'
    );
  });

  it('rolls the local date over partway down the grid', () => {
    // Tokyo passes midnight three hours into the summit.
    expect(formatSlotDay(slots[2], 'Asia/Tokyo', 'en-GB')).toBe('Mon 31 Aug');
    expect(formatSlotDay(slots[3], 'Asia/Tokyo', 'en-GB')).toBe('Tue 1 Sept');
  });

  it('names the zone the times are shown in', () => {
    const reference = new Date(slots[0].start);
    expect(timeZoneLabel('UTC', reference, 'en-GB')).toBe('UTC');
    expect(timeZoneLabel('Asia/Tokyo', reference, 'en-GB')).toBe('GMT+9');
  });
});

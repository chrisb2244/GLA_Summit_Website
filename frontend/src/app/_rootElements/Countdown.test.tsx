import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Countdown } from './Countdown';

describe('Countdown', () => {
  const now = new Date(Date.UTC(2022, 10, 11, 10, 0, 0));
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  const start = new Date(Date.UTC(2022, 10, 15, 12, 0, 0));
  const end = new Date(Date.UTC(2022, 10, 16, 12, 0, 0));

  it('contains days, hours, minutes, seconds', () => {
    render(<Countdown event_start={start} event_end={end} />);
    // Status (and the counter contents) are first set inside the 1s interval,
    // so advance past one tick before asserting.
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByTitle('countdown').textContent).toMatch(
      /days.*hours.*minutes.*seconds/i
    );
  });
});

import { render, screen } from '@testing-library/react';
import { Countdown } from '@/Components/Countdown';
import { act } from 'react-dom/test-utils';

describe('Countdown', () => {
  const now = new Date(Date.UTC(2022, 10, 11, 10, 0, 0));
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(now);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  const start = new Date(Date.UTC(2022, 10, 15, 12, 0, 0));
  const end = new Date(Date.UTC(2022, 10, 16, 12, 0, 0));

  it('contains days, hours, minutes, seconds', () => {
    render(<Countdown event_start={start} event_end={end} />);
    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.getByTitle('countdown')).toHaveTextContent(
      /.*days.*hours.*minutes.*seconds/i
    );
  });

  it('is centered in the container', () => {
    // This test might be broken now...

    render(<Countdown event_start={start} event_end={end} />).container;
    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.getByTitle('countdown')).toHaveClass('flex');
  });
});

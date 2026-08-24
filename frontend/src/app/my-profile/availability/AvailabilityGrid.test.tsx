import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  beforeEach,
  vi
} from 'vitest';
import { render, fireEvent, act, cleanup } from '@testing-library/react';
import { AvailabilityGrid, type LockedSlot } from './AvailabilityGrid';
import { buildSlots } from './slots';

// The real action is a server action; the grid's interaction is what is under
// test here, and it never reaches the server.
vi.mock('./availabilityActions', () => ({
  saveAvailabilityAction: vi.fn(
    async (previous: { slots: string[] }) => previous
  )
}));

// jsdom ships no PointerEvent, so without this every synthetic pointer event
// arrives with `pointerType`, `button` and `clientX/Y` undefined — which the
// painter would read as an anonymous touch that never moves. Testing Library
// constructs the real thing as soon as the constructor is on `window`.
class TestPointerEvent extends MouseEvent {
  readonly pointerType: string;
  readonly pointerId: number;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? 'mouse';
    this.pointerId = init.pointerId ?? 1;
  }
}

beforeAll(() => {
  window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent;
});

const slots = buildSlots('2026');

const renderGrid = (
  overrides: {
    initialSelected?: string[];
    locked?: LockedSlot[];
  } = {}
) => {
  const view = render(
    <AvailabilityGrid
      year='2026'
      slots={slots}
      initialSelected={overrides.initialSelected ?? []}
      locked={overrides.locked ?? []}
      storedTimeZone='Asia/Tokyo'
    />
  );

  const cells = () =>
    Array.from(
      view.container.querySelectorAll<HTMLElement>('[data-slot-index]')
    );
  const boxes = () =>
    Array.from(
      view.container.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]'
      )
    );
  const checkedIndexes = () =>
    boxes().flatMap((box, index) => (box.checked ? [index] : []));

  // jsdom has no layout, so the painter's hit-testing needs a stand-in. The
  // convention below is local to these tests: a point's y coordinate *is* the
  // slot index it lands on.
  document.elementFromPoint = ((_x: number, y: number) =>
    cells()[y] ?? null) as typeof document.elementFromPoint;

  return { ...view, cells, boxes, checkedIndexes };
};

const mouseDownOn = (cell: HTMLElement) =>
  fireEvent.pointerDown(cell, {
    pointerType: 'mouse',
    button: 0,
    clientX: 0,
    clientY: 0
  });

const dragTo = (index: number) =>
  fireEvent.pointerMove(window, { clientX: 0, clientY: index });

const release = () => fireEvent.pointerUp(window);

describe('AvailabilityGrid', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  // This project does not run vitest with `globals`, so Testing Library never
  // registers its own afterEach — without this, each render stacks up in the
  // document and the by-role queries below find one button per test so far.
  afterEach(cleanup);

  it('offers every hour of the summit, in UTC and in the display zone', () => {
    const view = renderGrid();
    expect(view.cells()).toHaveLength(24);
    expect(view.container.textContent).toContain('12:00–13:00 UTC');
    // 12:00 UTC is 21:00 in Tokyo.
    expect(view.container.textContent).toContain('21:00–22:00 GMT+9');
  });

  it('starts with the hours already saved', () => {
    const view = renderGrid({ initialSelected: [slots[3].start] });
    expect(view.checkedIndexes()).toEqual([3]);
  });

  it('toggles a single hour on click', () => {
    const view = renderGrid();
    fireEvent.click(view.boxes()[5]);
    expect(view.checkedIndexes()).toEqual([5]);
    fireEvent.click(view.boxes()[5]);
    expect(view.checkedIndexes()).toEqual([]);
  });

  it('paints a run of hours when the mouse is dragged across them', () => {
    const view = renderGrid();
    mouseDownOn(view.cells()[2]);
    dragTo(5);
    release();
    expect(view.checkedIndexes()).toEqual([2, 3, 4, 5]);
  });

  it('paints the same run when dragged upwards', () => {
    const view = renderGrid();
    mouseDownOn(view.cells()[5]);
    dragTo(2);
    release();
    expect(view.checkedIndexes()).toEqual([2, 3, 4, 5]);
  });

  it('shrinks the run again when the drag is pulled back', () => {
    const view = renderGrid();
    mouseDownOn(view.cells()[2]);
    dragTo(8);
    dragTo(4);
    release();
    expect(view.checkedIndexes()).toEqual([2, 3, 4]);
  });

  it('erases when the drag starts on an hour already offered', () => {
    const view = renderGrid({
      initialSelected: slots.slice(2, 8).map((slot) => slot.start)
    });
    expect(view.checkedIndexes()).toEqual([2, 3, 4, 5, 6, 7]);
    mouseDownOn(view.cells()[3]);
    dragTo(5);
    release();
    expect(view.checkedIndexes()).toEqual([2, 6, 7]);
  });

  it('fills a mixed run rather than inverting it', () => {
    const view = renderGrid({ initialSelected: [slots[4].start] });
    mouseDownOn(view.cells()[2]);
    dragTo(6);
    release();
    expect(view.checkedIndexes()).toEqual([2, 3, 4, 5, 6]);
  });

  it('leaves a scheduled hour locked on, and paints around it', () => {
    const view = renderGrid({
      locked: [{ slotStart: slots[4].start, titles: ['Actor Framework'] }]
    });
    expect(view.checkedIndexes()).toEqual([4]);
    expect(view.boxes()[4].disabled).toBe(true);
    expect(view.container.textContent).toContain('Scheduled: Actor Framework');

    mouseDownOn(view.cells()[2]);
    dragTo(6);
    release();
    expect(view.checkedIndexes()).toEqual([2, 3, 4, 5, 6]);

    // Erasing back across it must not take the scheduled hour with it.
    mouseDownOn(view.cells()[2]);
    dragTo(6);
    release();
    expect(view.checkedIndexes()).toEqual([4]);
  });

  it('does not start a stroke from a locked hour', () => {
    const view = renderGrid({
      locked: [{ slotStart: slots[4].start, titles: ['Actor Framework'] }]
    });
    mouseDownOn(view.cells()[4]);
    dragTo(6);
    release();
    expect(view.checkedIndexes()).toEqual([4]);
  });

  it('keeps scheduled hours through select-all and clear', () => {
    const view = renderGrid({
      locked: [{ slotStart: slots[4].start, titles: ['Actor Framework'] }]
    });
    fireEvent.click(view.getByRole('button', { name: 'Select all 24 hours' }));
    expect(view.checkedIndexes()).toHaveLength(24);
    fireEvent.click(view.getByRole('button', { name: 'Clear' }));
    expect(view.checkedIndexes()).toEqual([4]);
  });

  it('only enables saving once the selection differs from what was saved', () => {
    const view = renderGrid({ initialSelected: [slots[3].start] });
    const save = view.getByRole('button', {
      name: 'Save availability'
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.click(view.boxes()[5]);
    expect(save.disabled).toBe(false);

    // Back to the saved set: nothing to save again.
    fireEvent.click(view.boxes()[5]);
    expect(save.disabled).toBe(true);
  });

  it('summarises the offer as contiguous ranges', () => {
    const view = renderGrid();
    mouseDownOn(view.cells()[0]);
    dragTo(2);
    release();
    // 12:00-15:00 UTC is 21:00-00:00 in Tokyo.
    expect(view.container.textContent).toContain(
      'Offering 3 hours: 21:00–00:00 GMT+9'
    );
  });

  it('says that an empty answer is not a claim of total availability', () => {
    const view = renderGrid();
    expect(view.container.textContent).toContain('No hours offered yet');
  });

  describe('touch', () => {
    it('leaves a tap to the checkbox, so a swipe can still scroll', () => {
      vi.useFakeTimers();
      const view = renderGrid();
      fireEvent.pointerDown(view.cells()[3], {
        pointerType: 'touch',
        clientX: 0,
        clientY: 3
      });
      // Released before the hold completes: no stroke, and the browser's own
      // click on the label is what toggles the hour.
      release();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(view.checkedIndexes()).toEqual([]);
      vi.useRealTimers();

      fireEvent.click(view.boxes()[3]);
      expect(view.checkedIndexes()).toEqual([3]);
    });

    it('starts painting once a finger has been held long enough', () => {
      vi.useFakeTimers();
      const view = renderGrid();
      fireEvent.pointerDown(view.cells()[3], {
        pointerType: 'touch',
        clientX: 0,
        clientY: 3
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(view.checkedIndexes()).toEqual([3]);

      dragTo(6);
      release();
      expect(view.checkedIndexes()).toEqual([3, 4, 5, 6]);
      vi.useRealTimers();
    });

    it('abandons the hold if the finger moves — that gesture was a scroll', () => {
      vi.useFakeTimers();
      const view = renderGrid();
      fireEvent.pointerDown(view.cells()[3], {
        pointerType: 'touch',
        clientX: 0,
        clientY: 3
      });
      // Drifting well past the tolerance before the timer fires.
      fireEvent.pointerMove(window, { clientX: 0, clientY: 60 });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(view.checkedIndexes()).toEqual([]);
      vi.useRealTimers();
    });
  });
});

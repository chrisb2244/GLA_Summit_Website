'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type PaintMode = 'paint' | 'erase';

export type SlotPainterOptions = {
  /**
   * Slot keys in grid order. A drag selects the range between the index the
   * gesture started on and the index under the pointer now, so this array's
   * order — not the visual column layout — is what a sweep follows.
   */
  slotKeys: readonly string[];
  /** Keys a gesture must skip over: hours the presenter is already scheduled in. */
  lockedKeys: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /**
   * How long a finger must rest before the gesture becomes a paint rather than a
   * scroll. 300ms is the usual press-and-hold threshold (Android's long-press,
   * iOS's context menu), short enough not to feel stuck and long enough that a
   * flick past the control is never mistaken for one.
   */
  longPressMs?: number;
  /**
   * How far a finger may drift during the hold and still count as a press. Past
   * this the gesture is a scroll and the pending press is abandoned.
   */
  moveTolerancePx?: number;
};

const DEFAULT_LONG_PRESS_MS = 300;
const DEFAULT_MOVE_TOLERANCE_PX = 10;

/** The slot index under a viewport point, or null if the point is off the grid. */
const slotIndexAtPoint = (x: number, y: number): number | null => {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>('[data-slot-index]');
  if (cell == null) {
    return null;
  }
  const index = Number(cell.dataset.slotIndex);
  return Number.isInteger(index) ? index : null;
};

/**
 * Click-and-drag (mouse) and long-press-and-drag (touch) painting over a list of
 * slots.
 *
 * The two input types deliberately differ. A mouse has no competing gesture, so
 * pressing starts painting at once. A finger does: a vertical drag on a tall
 * grid is overwhelmingly likely to be someone scrolling the page, so touch waits
 * for a deliberate hold before it claims the gesture, and a plain swipe scrolls
 * as it always would. A tap is left entirely to the underlying checkbox, which
 * is also what makes the control work by keyboard and under a screen reader.
 */
export const useSlotPainter = (options: SlotPainterOptions) => {
  const {
    slotKeys,
    lockedKeys,
    selected,
    onChange,
    longPressMs = DEFAULT_LONG_PRESS_MS,
    moveTolerancePx = DEFAULT_MOVE_TOLERANCE_PX
  } = options;

  const [isPainting, setIsPainting] = useState(false);

  /** The live gesture: what it is doing, where it started, and to what. */
  const strokeRef = useRef<{
    mode: PaintMode;
    anchor: number;
    /** The selection as it was when the stroke began, so dragging back undoes. */
    base: ReadonlySet<string>;
  } | null>(null);

  /** A touch that is being held but has not yet become a paint. */
  const pendingRef = useRef<{
    index: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  /**
   * A completed stroke leaves a click behind on the cell it started on. That
   * click would reach the checkbox and undo the first hour the stroke painted,
   * so the next one is swallowed.
   */
  const swallowClickRef = useRef(false);

  // Read through refs inside the window-level listeners: those are registered
  // once per stroke, and must not capture a selection or callback that has since
  // moved on. Synced in an effect rather than during render — a ref written
  // while rendering is a tear waiting to happen under concurrent rendering, and
  // an effect lands well before any pointer can reach the grid.
  const selectedRef = useRef(selected);
  const onChangeRef = useRef(onChange);
  const slotKeysRef = useRef(slotKeys);
  const lockedKeysRef = useRef(lockedKeys);
  useEffect(() => {
    selectedRef.current = selected;
    onChangeRef.current = onChange;
    slotKeysRef.current = slotKeys;
    lockedKeysRef.current = lockedKeys;
  });

  const clearPending = useCallback(() => {
    if (pendingRef.current !== null) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  }, []);

  const applyStrokeTo = useCallback((toIndex: number) => {
    const stroke = strokeRef.current;
    if (stroke === null) {
      return;
    }
    const next = new Set(stroke.base);
    const from = Math.min(stroke.anchor, toIndex);
    const to = Math.max(stroke.anchor, toIndex);
    for (let index = from; index <= to; index++) {
      const key = slotKeysRef.current[index];
      if (key === undefined || lockedKeysRef.current.has(key)) {
        continue;
      }
      if (stroke.mode === 'paint') {
        next.add(key);
      } else {
        next.delete(key);
      }
    }
    onChangeRef.current(next);
  }, []);

  const beginStroke = useCallback(
    (index: number) => {
      const key = slotKeysRef.current[index];
      if (key === undefined || lockedKeysRef.current.has(key)) {
        return;
      }
      // Whether a sweep adds or removes is decided once, by the hour it started
      // on. Toggling each hour independently would make a drag across a mixed
      // run invert it rather than fill it, which is not what the gesture reads as.
      strokeRef.current = {
        mode: selectedRef.current.has(key) ? 'erase' : 'paint',
        anchor: index,
        base: new Set(selectedRef.current)
      };
      swallowClickRef.current = true;
      setIsPainting(true);
      applyStrokeTo(index);
    },
    [applyStrokeTo]
  );

  const endStroke = useCallback(() => {
    strokeRef.current = null;
    setIsPainting(false);
  }, []);

  // While a stroke is live the whole window is in play: the pointer may leave
  // the grid, and the gesture should follow it rather than stick.
  useEffect(() => {
    if (!isPainting) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const index = slotIndexAtPoint(event.clientX, event.clientY);
      if (index !== null) {
        applyStrokeTo(index);
      }
    };

    // Pointer events cannot stop a scroll; only a non-passive touchmove can. The
    // hold that started this stroke means the finger has been still, so no scroll
    // is under way yet and this preventDefault still bites.
    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endStroke);
    window.addEventListener('pointercancel', endStroke);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endStroke);
      window.removeEventListener('pointercancel', endStroke);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [isPainting, applyStrokeTo, endStroke]);

  // A held finger that starts moving was a scroll all along.
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const pending = pendingRef.current;
      if (pending === null) {
        return;
      }
      const drift = Math.hypot(
        event.clientX - pending.x,
        event.clientY - pending.y
      );
      if (drift > moveTolerancePx) {
        clearPending();
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', clearPending);
    window.addEventListener('pointercancel', clearPending);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', clearPending);
      window.removeEventListener('pointercancel', clearPending);
    };
  }, [clearPending, moveTolerancePx]);

  useEffect(() => clearPending, [clearPending]);

  const onCellPointerDown = useCallback(
    (index: number, event: React.PointerEvent<HTMLElement>) => {
      const key = slotKeysRef.current[index];
      if (key === undefined || lockedKeysRef.current.has(key)) {
        return;
      }

      if (event.pointerType === 'mouse') {
        if (event.button !== 0) {
          return;
        }
        // Stops the drag selecting the labels' text as it sweeps.
        event.preventDefault();
        beginStroke(index);
        return;
      }

      clearPending();
      pendingRef.current = {
        index,
        x: event.clientX,
        y: event.clientY,
        timer: setTimeout(() => {
          pendingRef.current = null;
          // A short tick to mark the moment the control takes the gesture over.
          // Absent on iOS, where it is a no-op rather than an error.
          navigator.vibrate?.(10);
          beginStroke(index);
        }, longPressMs)
      };
    },
    [beginStroke, clearPending, longPressMs]
  );

  const onGridClickCapture = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (swallowClickRef.current) {
        swallowClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    []
  );

  return { isPainting, onCellPointerDown, onGridClickCapture };
};

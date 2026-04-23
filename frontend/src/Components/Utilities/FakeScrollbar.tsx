import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef
} from 'react';

export type ScrollbarProps = {
  initialPosition?: number;
  onScroll: (relativePosition: number) => void;
};
type MyMouseEvent = { type: string; pageY: number; clientY: number };

type TrackBounds = {
  top: number;
  bottom: number;
  height: number;
  topPad: number;
  bottomPad: number;
};

type State = {
  trackBounds: TrackBounds | null;
  isDragging: boolean;
  fractionalPosition: number;
  mouse?: MyMouseEvent;
};

type Action =
  | {
      type: 'drag-start';
    }
  | {
      type: 'trackBounds';
      payload: TrackBounds;
    }
  | {
      type: 'drag';
      pageY: number;
    }
  | {
      type: 'drag-release';
    }
  | {
      type: 'scrollTo';
      to: number;
      top: number;
      pageY: number;
    }
  | {
      type: 'mouseEvent';
      event: MyMouseEvent;
    };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'drag-start':
      return {
        ...state,
        isDragging: true
      };
    case 'drag':
      return {
        ...state,
        isDragging: true
      };
    case 'drag-release':
      return {
        ...state,
        isDragging: false
      };

    case 'scrollTo':
      return {
        ...state,
        fractionalPosition: action.to
      };

    case 'mouseEvent':
      return {
        ...state,
        mouse: {
          type: action.event.type,
          pageY: action.event.pageY,
          clientY: action.event.clientY
        }
      };

    case 'trackBounds':
      return {
        ...state,
        trackBounds: action.payload
      };
  }
};

export const FakeScrollbar = (props: ScrollbarProps) => {
  const barHeight = 32;
  const barHalfHeight = barHeight / 2;
  const initPos = props.initialPosition ?? 0;
  const initialState: State = {
    trackBounds: null,
    isDragging: false,
    fractionalPosition: initPos,
    mouse: undefined
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const resizeListenerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestFrame = useCallback((callback: () => void) => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(callback);
      return;
    }

    window.setTimeout(callback, 1000 / 60);
  }, []);

  // Forwards debounced mouse events
  const onMouseEvent = useCallback(
    (e: globalThis.MouseEvent) => {
      if (e.type === 'mouseup') {
        dispatch({ type: 'mouseEvent', event: e });
      } else {
        requestFrame(() => dispatch({ type: 'mouseEvent', event: e }));
      }
    },
    [requestFrame]
  );

  const toggleDragEvents = useCallback((toggle = true) => {
    try {
      if (toggle) {
        document.addEventListener('mousemove', onMouseEvent);
        document.addEventListener('mouseup', onMouseEvent);
      } else {
        document.removeEventListener('mousemove', onMouseEvent);
        document.removeEventListener('mouseup', onMouseEvent);
      }
    } catch (e) {
      console.error(e);
    }
  }, [onMouseEvent]);

  const getTrackBounds = useCallback(() => {
    const track = trackRef.current;
    if (track === null) {
      return null;
    }

    const { top, bottom, height } = track.getBoundingClientRect();
    const { paddingTop, paddingBottom } = window.getComputedStyle(track, null);

    const bounds: TrackBounds = {
      top,
      bottom,
      height,
      topPad: parseInt(paddingTop, 10),
      bottomPad: parseInt(paddingBottom, 10)
    };

    dispatch({ type: 'trackBounds', payload: bounds });
    return bounds;
  }, []);

  const onScrollResize = useCallback(() => {
    getTrackBounds();
    if (resizeListenerRef.current !== null) {
      clearTimeout(resizeListenerRef.current);
    }
    resizeListenerRef.current = setTimeout(getTrackBounds, 200);
  }, [getTrackBounds]);

  // click-holding the bar and moving it
  const onDrag = useCallback((ev: MyMouseEvent) => {
    const { trackBounds } = state;
    if (trackBounds === null || trackBounds.height <= 0) {
      return;
    }
    const availableHeight = trackBounds.height;
    const newFracHeight = (ev.clientY - trackBounds.top) / availableHeight;

    requestFrame(() => {
      const isDragWithinTrackBounds =
        ev.pageY >= trackBounds.top + barHalfHeight &&
        ev.pageY <= trackBounds.bottom - barHalfHeight;
      if (isDragWithinTrackBounds) {
        const to = Math.min(
          1,
          Math.max(
            0,
            (newFracHeight * availableHeight) /
              (availableHeight - barHalfHeight)
          )
        );
        dispatch({
          type: 'scrollTo',
          to,
          pageY: ev.clientY,
          top: newFracHeight * availableHeight - barHalfHeight
        });
      } else {
        dispatch({ type: 'drag', pageY: ev.clientY });
      }
    });
  }, [barHalfHeight, requestFrame, state]);

  const onStopDrag = useCallback(() => {
    toggleDragEvents(false);
    setTimeout(dispatch, 0, { type: 'drag-release' });
  }, [toggleDragEvents]);

  const onBarGrab = useCallback((ev: MyMouseEvent) => {
    dispatch({ type: 'drag-start' });
    dispatch({ type: 'mouseEvent', event: ev });
    toggleDragEvents(true);
  }, [toggleDragEvents]);

  useLayoutEffect(() => {
    onScrollResize();
    window.addEventListener('resize', onScrollResize);
    return () => {
      window.removeEventListener('resize', onScrollResize);
      toggleDragEvents(false);
      if (resizeListenerRef.current !== null) {
        clearTimeout(resizeListenerRef.current);
      }
    };
  }, [onScrollResize, toggleDragEvents]);

  useEffect(() => {
    if (typeof state.mouse === 'undefined') {
      return;
    }
    const { type } = state.mouse;
    if (type === 'mousemove' || type === 'mousedown') {
      onDrag(state.mouse);
    } else if (type === 'mouseup') {
      onStopDrag();
    }
  }, [onDrag, onStopDrag, state.mouse]);

  const { onScroll } = props;
  useEffect(() => {
    onScroll(state.fractionalPosition);
  }, [onScroll, state.fractionalPosition]);

  const availableHeight = state.trackBounds?.height ?? 0;
  const sTop = state.trackBounds?.top ?? 0;
  const barTop =
    availableHeight > 0
      ? Math.min(state.fractionalPosition, (availableHeight - barHeight) / availableHeight) *
        100
      : 0;

  const onTrackClick: MouseEventHandler<HTMLDivElement> = useCallback((ev) => {
    if (state.isDragging || availableHeight <= 0) {
      return;
    }

    const newFracHeight = (ev.clientY - sTop) / availableHeight;
    const to = Math.min(
      1,
      Math.max(0, (newFracHeight * availableHeight) / (availableHeight - barHalfHeight))
    );
    dispatch({
      type: 'scrollTo',
      to,
      pageY: ev.clientY,
      top: newFracHeight * availableHeight - barHalfHeight
    });
  }, [availableHeight, barHalfHeight, sTop, state.isDragging]);

  return (
    <div
      className='relative h-full w-4'
      ref={trackRef}
      onClick={onTrackClick}
    >
      <div
        className='absolute mx-auto h-8 w-4/5 bg-gray-400'
        onMouseDown={onBarGrab}
        style={{
          height: `${barHeight}`,
          top: `${barTop}%`,
          overflow: 'auto'
        }}
      />
    </div>
  );
};

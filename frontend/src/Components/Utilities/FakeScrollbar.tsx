import {
  createRef,
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef
} from 'react'

export type ScrollbarProps = {
  initialPosition?: number
  onScroll: (relativePosition: number) => void
}
type MyMouseEvent = { type: string; pageY: number }

type TrackBounds = {
  top: number
  bottom: number
  height: number
  topPad: number
  bottomPad: number
}

type State = {
  trackBounds: TrackBounds | null
  isDragging: boolean
  startFractionalPosition: number
  fractionalPosition: number
  lastPageY: number
  smoothScroll: boolean
  barStyle?: {}
  mouse?: MyMouseEvent
}

type Action =
  | {
      type: 'toggleSmoothScroll'
      payload?: boolean
    }
  | {
      type: 'bar-grab'
      pageY: number
    }
  | {
      type: 'barProps'
      payload: {
        top: number
        height: number
      }
    }
  | {
      type: 'trackBounds'
      payload: TrackBounds
    }
  | {
      type: 'drag'
      pageY: number
    }
  | {
      type: 'drag-release'
    }
  | {
      type: 'scrollTo'
      to: number
      top: number
      pageY: number
    }
  | {
      type: 'mouseEvent'
      event: MyMouseEvent
    }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'bar-grab':
      return {
        ...state,
        startFractionalPosition: state.fractionalPosition,
        lastPageY: action.pageY
      }
    case 'drag':
      return {
        ...state,
        isDragging: true
        // lastPageY: action.pageY || state.lastPageY
      }
    case 'drag-release':
      return {
        ...state,
        isDragging: false
      }

    case 'scrollTo':
      return {
        ...state,
        barStyle: {
          ...state.barStyle,
          top: action.top
        },
        fractionalPosition: action.to
      }

    case 'mouseEvent':
      return {
        ...state,
        mouse: { type: action.event.type, pageY: action.event.pageY }
      }

    case 'trackBounds':
      return {
        ...state,
        trackBounds: action.payload
      }
    case 'barProps':
      return {
        ...state,
        barStyle: {
          height: `${action.payload.height}`,
          top: `${action.payload.top}%`,
          overflow: 'auto'
        }
      }
    case 'toggleSmoothScroll':
      return {
        ...state,
        smoothScroll: action.payload ?? !state.smoothScroll
      }
  }
}

export const FakeScrollbar = (props: ScrollbarProps) => {
  const initPos = props.initialPosition ?? 0
  const initialState: State = {
    trackBounds: null,
    isDragging: false,
    fractionalPosition: initPos,
    startFractionalPosition: initPos,
    lastPageY: 0,
    smoothScroll: false,
    barStyle: {
      height: 32,
      top: 0
    },
    mouse: undefined
  }
  // For debouncing?
  const raf =
    (typeof window !== undefined && window.requestAnimationFrame) ||
    ((cb) => window.setTimeout(cb, 1000 / 60))

  const [state, dispatch] = useReducer(reducer, initialState)
  const refs = useMemo(
    () => ({
      track: createRef<HTMLDivElement>()
    }),
    []
  )

  const resizeListener = useRef<NodeJS.Timeout | undefined>(undefined)

  const fullBarBoundingBox = refs.track.current?.getBoundingClientRect()
  const availableHeight = fullBarBoundingBox?.height ?? 0
  const sTop = fullBarBoundingBox?.top ?? 0

  // Forwards debounced mouse events
  const onMouseEvent = useCallback(
    (e: globalThis.MouseEvent) => {
      raf(() => dispatch({ type: 'mouseEvent', event: e }))
    },
    [dispatch, raf]
  )

  const onScrollResize = useCallback(() => {
    setBarGeometry()
    // debounce - get track bounds
    clearTimeout(resizeListener.current)
    resizeListener.current = setTimeout(getTrackBounds, 200)
  }, [availableHeight])

  useLayoutEffect(() => {
    onScrollResize()
    window.addEventListener('resize', onScrollResize)
    return () => {
      window.removeEventListener('resize', onScrollResize)
      toggleDragEvents(false)
    }
  }, [onScrollResize])

  useEffect(() => {
    if (typeof state.mouse === 'undefined') {
      return
    }
    const { type } = state.mouse
    if (type == 'mousemove') {
      onDrag(state.mouse)
    } else if (type == 'mouseup') {
      onStopDrag()
    }
  }, [state.mouse])

  const { onScroll } = props
  useEffect(() => {
    onScroll(state.fractionalPosition)
  }, [onScroll, state.fractionalPosition])

  const toggleDragEvents = (toggle = true) => {
    try {
      if (toggle) {
        document.addEventListener('mousemove', onMouseEvent)
        document.addEventListener('mouseup', onMouseEvent)
      } else {
        document.removeEventListener('mousemove', onMouseEvent)
        document.removeEventListener('mouseup', onMouseEvent)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // click-holding the bar and moving it
  const onDrag = (ev: MyMouseEvent) => {
    const { trackBounds } = state
    if (trackBounds === null || typeof availableHeight === 'undefined') {
      return
    }
    const newFracHeight = (ev.pageY - sTop) / availableHeight

    raf(() => {
      const isDragWithinTrackBounds =
        ev.pageY >= trackBounds.top + 16 && ev.pageY <= trackBounds.bottom - 16
      if (isDragWithinTrackBounds) {
        const to = (newFracHeight * availableHeight) / (availableHeight - 16)
        dispatch({
          type: 'scrollTo',
          to,
          pageY: ev.pageY,
          top: newFracHeight * availableHeight - 16
        })
        // setBarGeometry()
      } else {
        dispatch({ type: 'drag', pageY: ev.pageY })
      }
    })
  }

  const onStopDrag = () => {
    toggleDragEvents(false)
    setTimeout(dispatch, 0, { type: 'drag-release' })
  }

  const onBarGrab = (ev: MyMouseEvent) => {
    dispatch({ type: 'bar-grab', pageY: ev.pageY })
    toggleDragEvents(true)
  }

  const getTrackBounds = useCallback(() => {
    if (refs.track.current === null) {
      return
    }
    // DOMRects aren't normal objects and can't be expanded as ...bounds
    const { top, bottom, height } = refs.track.current.getBoundingClientRect()
    const { paddingTop, paddingBottom } = window.getComputedStyle(
      refs.track.current,
      null
    )

    const boundsExp: TrackBounds = {
      top,
      bottom,
      height,
      topPad: parseInt(paddingTop, 10),
      bottomPad: parseInt(paddingBottom, 10)
    }

    dispatch({ type: 'trackBounds', payload: boundsExp })
    return boundsExp
  }, [refs.track])

  // Move the 'scroll' element
  const setBarGeometry = () => {
    raf(() => {
      dispatch({
        type: 'barProps',
        payload: {
          height: 32,
          top: Math.min(state.fractionalPosition, ((availableHeight - 32) / availableHeight)) * 100
        }
      })
    })
  }

  const onTrackClick: MouseEventHandler<HTMLDivElement> = (ev) => {
    if (state.isDragging) {
      return
    }

    const newFracHeight = (ev.pageY - sTop) / availableHeight
    const to = (newFracHeight * availableHeight) / (availableHeight - 16)
    dispatch({
      type: 'scrollTo',
      to,
      pageY: ev.pageY,
      top: newFracHeight * availableHeight - 16
    })
  }

  return (
    <div
      className='h-full w-4 relative'
      ref={refs.track}
      onClick={onTrackClick}
    >
      <div
        className='mx-auto w-4/5 h-8 bg-gray-400 absolute'
        onMouseDown={onBarGrab}
        style={state.barStyle}
      />
    </div>
  )
}

import { Database } from '@/lib/sb_databaseModels'
// import { FormControlLabel, Switch } from '@mui/material'
import {
  startTransition,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'
import { FakeScrollbar } from '../Utilities/FakeScrollbar'
import { ContainerHint } from './AgendaCalculations'
import { AgendaPresentations } from './AgendaPresentations'
import { TimeMarkers } from './TimeMarkers'

export type AgendaEntry =
  Database['public']['Views']['all_presentations']['Row']
export type ScheduledAgendaEntry = {
  [P in keyof AgendaEntry]: NonNullable<AgendaEntry[P]>
}

export type AgendaProps = {
  agendaEntries: ScheduledAgendaEntry[]
  hoursToShow: number
  startDate: Date
  durationInHours?: number
  noContainer?: boolean
  favourites?: string[]
  containerHints?: ContainerHint[]
}

export const Agenda = (props: AgendaProps) => {
  const totalDuration =
    (props.durationInHours ? Math.round(props.durationInHours) : 24) *
    60 *
    60 *
    1000
  // const timeNow = new Date(Date.UTC(2021, 10, 15, 18, 30))

  // const [advanceTime, toggleAdvanceTime] = useState(false)
  const advanceTime = true
  const timePeriod = 1000 * 30 // update every 30s
  const [timeoutRef, setTimeoutRef] = useState<NodeJS.Timeout | null>(null)

  const startCount = props.startDate.getTime()
  const endCount = startCount + totalDuration
  const [timeNow, refreshTime] = useReducer(() => {
    const now = new Date().getTime()
    const cappedTime = Math.max(Math.min(now, endCount), startCount)
    return new Date(cappedTime)
  }, new Date())

  const pixelsPerMinute = 2

  useEffect(() => {
    if (advanceTime) {
      setTimeoutRef(
        setInterval(() => {
          startTransition(() => {
            refreshTime()
          })
        }, timePeriod)
      )
    } else if (timeoutRef !== null) {
      clearInterval(timeoutRef)
    }
    return () => {
      if (timeoutRef !== null) {
        clearInterval(timeoutRef)
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [advanceTime]) // Don't include 'timeoutRef'

  const [timeOffset, setScrollTimeOffset] = useState(0)
  const [agendaArea, setAgendaArea] = useState<DOMRect | undefined>(undefined)
  const dataColumnRef = useRef<HTMLDivElement | null>(null)

  const handleResize = useCallback(() => {
    const rect = dataColumnRef.current?.getBoundingClientRect()
    if (
      rect?.height !== agendaArea?.height ||
      rect?.width !== agendaArea?.width
    ) {
      setAgendaArea(rect)
    }
  }, [dataColumnRef, setAgendaArea, agendaArea])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  useEffect(() => {
    handleResize()
  }, [dataColumnRef, handleResize])

  const currentExtent = props.hoursToShow * 60 * 60 * 1000
  // Adjust fractionalTime for the reformatting necessary to have some overlap (i.e. a total window > 24h)
  const uncappedFractionalTime =
    (timeNow.getTime() - props.startDate.getTime() + currentExtent / 6) /
    (totalDuration - (2 * currentExtent) / 3)
  const fractionalTime = Math.min(1, Math.max(0, uncappedFractionalTime))

  const pixelsPer_ms = (agendaArea?.height ?? 0) / currentExtent
  const millisRelOffset = currentExtent / 12
  const timeNowOffsetTop = pixelsPer_ms * (millisRelOffset - timeOffset)
  const showTimeNowLine =
    timeNowOffsetTop > 0 && timeNowOffsetTop < (agendaArea?.height ?? 0)

  const dateToString = (date: Date) => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      // timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: undefined,
      dateStyle: undefined,
      hour12: false
    })
    return formatter.format(date)
  }

  const timeNowLine = (
    <div
      className='h-px border-2 border-primaryc absolute box-border border-dashed'
      style={{
        left: '-0.5ch',
        width: 'calc(100% + 1.5ch)',
        top: timeNowOffsetTop, // (agendaArea?.height ?? 0) * (1 / 12), // will need changing for scroll
        display: showTimeNowLine ? 'block' : 'none',
        zIndex: '5'
      }}
    />
  )

  return (
    <>
      {/* <FormControlLabel
        control={<Switch onChange={() => toggleAdvanceTime(!advanceTime)} />}
        label='Advance Time'
      /> */}
      {/* <p>{`Time now: ${dateToString(timeNow)}`}</p> */}
      <div className='relative flex w-full mb-5 py-4 box-content border-primaryc border-2 select-none' style={{height: `${totalDuration * pixelsPerMinute / (60 * 1000)}px`}}>
        <div className='relative w-[6ch] border-1 border-primaryc'>
          {agendaArea && (
            <TimeMarkers
              startDate={props.startDate}
              pixelsPerMinute={pixelsPerMinute}
              durationInHours={24}
              stringFormatter={dateToString}
            />
          )}
        </div>
        <div
          id='presentations'
          className='flex-grow relative box-border'
          ref={dataColumnRef}
        >
          {agendaArea && (
            <AgendaPresentations
              pixelsPerMinute={pixelsPerMinute}
              start={props.startDate}
              width={agendaArea.width}
              presentations={props.agendaEntries}
              favourites={props.favourites}
              containerHints={props.containerHints}
            />
          )}
          {/* {timeNowLine} */}
        </div>
        {/* <FakeScrollbar
          initialPosition={fractionalTime}
          onScroll={(num) => {
            const offsetTimeInt =
              (totalDuration - (5 / 6) * currentExtent) * num - 0
            // currentExtent / 12
            setScrollTimeOffset(
              new Date(props.startDate.getTime() + offsetTimeInt).getTime() -
                timeNow.getTime()
            )
          }}
        /> */}
      </div>
    </>
  )
}

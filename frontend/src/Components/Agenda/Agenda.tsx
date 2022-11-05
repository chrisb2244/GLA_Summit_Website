import { Database } from '@/lib/sb_databaseModels'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FakeScrollbar } from '../Utilities/FakeScrollbar'
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
}

export const Agenda = (props: AgendaProps) => {
  const totalDuration =
    (props.durationInHours ? Math.round(props.durationInHours) : 24) *
    60 *
    60 *
    1000
  const timeNow = new Date(2021, 10, 16, 6, 30)
  // const [timeNow, setTimeNow] = useState(new Date(2021, 10, 16, 6, 30))
  // setTimeout(() => {
  //   startTransition(() => {
  //     setTimeNow(new Date(timeNow.getTime() + 60 * 1000))
  //   })
  // }, 100)

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

  const presentationSlots = props.agendaEntries
    .filter((a) => a.presentation_type !== '7x7') // These have bad startTimes (all the same) for 2021 testing
    .map((presentation) => {
      const startTime = new Date(presentation.scheduled_for)
      const pType = presentation.presentation_type
      const duration =
        pType === 'full length'
          ? 60
          : pType === '15 minutes'
          ? 15
          : pType === '7x7'
          ? 7
          : 60 // panel
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
      return {
        startTime,
        endTime,
        duration,
        title: presentation.title,
        link: '/presentations/' + presentation.presentation_id
      }
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

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

  return (
    <>
      <p>{`Time now: ${dateToString(timeNow)}`}</p>
      <p>{`Offset time now: ${dateToString(
        new Date(timeNow.getTime() + timeOffset)
      )}`}</p>
      <div className='relative flex w-full h-[90%] overflow-hidden mb-5 box-content border-primaryc border-2 select-none'>
        <div className='relative w-[6ch] border-1 border-primaryc'>
          {agendaArea && (
            <TimeMarkers
              startDate={props.startDate}
              currentTime={new Date(timeNow.getTime() + timeOffset)}
              extentInHours={props.hoursToShow}
              height={agendaArea.height}
              offsetFraction={1 / 12}
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
              currentTime={new Date(timeNow.getTime() + timeOffset)}
              extentInHours={props.hoursToShow}
              offsetFraction={1 / 12}
              agendaArea={agendaArea}
              presentations={presentationSlots}
            />
          )}
          <div
            className='h-px border-[0.2px] border-red-600 absolute box-border border-dashed border-opacity-50'
            style={{
              left: '-0.5ch',
              width: 'calc(100% + 0.5ch)',
              top: timeNowOffsetTop, // (agendaArea?.height ?? 0) * (1 / 12), // will need changing for scroll
              display: showTimeNowLine ? 'block' : 'none'
            }}
          />
        </div>
        <FakeScrollbar
          initialPosition={fractionalTime}
          onScroll={(num) => {
            const offsetTimeInt =
              (totalDuration - (2 / 3) * currentExtent) * num -
              currentExtent / 6
            setScrollTimeOffset(
              new Date(props.startDate.getTime() + offsetTimeInt).getTime() -
                timeNow.getTime()
            )
          }}
        />
      </div>
    </>
  )
}

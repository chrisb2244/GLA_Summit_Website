import useSWR, { Fetcher } from 'swr'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/sb_databaseModels'
import { useSession } from '@/lib/sessionContext'
import { PresentationYear } from '@/Components/PresentationSummary'
import { logErrorToDb } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { FakeScrollbar } from '@/Components/Utilities/FakeScrollbar'

type AgendaEntry = Database['public']['Views']['all_presentations']['Row']
type ScheduledAgendaEntry = {
  [P in keyof AgendaEntry]: NonNullable<AgendaEntry[P]>
}

// This is static...
const agendaFetcher: Fetcher<ScheduledAgendaEntry[], PresentationYear> = async (
  year: PresentationYear
) => {
  const { data, error } = await supabase
    .from('all_presentations')
    .select('*')
    .eq('year', year)
    .not('scheduled_for', 'is', 'null') // required for ScheduledAgendaEntry rather than AgendaEntry
  if (error) {
    throw error
  }
  return data as ScheduledAgendaEntry[] // not null filter in select
}

// This requires a user
const keyPrefix = 'agenda-'
const myAgendaFetcher: Fetcher<{}> = async (key: string | null) => {
  if (key === null) {
    throw new Error('Cannot load personalized agenda without user')
  }
  const userId = key.slice(keyPrefix.length)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    throw error
  }
  return data
}

const AgendaTestPage = () => {
  const { user } = useSession()
  const key = user ? keyPrefix + user.id : null

  const thisYear = '2021'
  const {
    data: fullAgenda,
    error: agendaError,
    isValidating: loadingAgenda
  } = useSWR(thisYear, agendaFetcher)
  // const { data: personalizedAgenda, error: myAgendaError, isValidating, mutate } = useSWR(key, myAgendaFetcher)

  const [agendaArea, setAgendaArea] = useState<DOMRect | undefined>(undefined)
  const dataColumnRef = useRef<HTMLDivElement | null>(null)

  const handleResize = () => {
    const rect = dataColumnRef.current?.getBoundingClientRect()
    if (
      rect?.height !== agendaArea?.height ||
      rect?.width !== agendaArea?.width
    ) {
      setAgendaArea(rect)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    handleResize()
  }, [dataColumnRef.current])

  const unableToRenderElem = (
    <p>Unable to load this year's agenda. Please try again later.</p>
  )

  if (agendaError !== null && typeof agendaError !== 'undefined') {
    logErrorToDb((agendaError as Error).message, 'error', user?.id)
    return unableToRenderElem
  }
  if (typeof fullAgenda === 'undefined') {
    return unableToRenderElem
  }

  const presentationSlots = fullAgenda
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

  const dateToString = (utcDateString: string) => {
    const date = new Date(utcDateString)
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

  const hoursToShow = 4.5
  const currentExtent = hoursToShow * 60 * 60 * 1000 // Viewable height in milliseconds (6 hours)
  const conferenceStart = new Date(Date.UTC(2021, 10, 15, 12, 0, 0))
  const timeNow = new Date(2021, 10, 16, 16, 3)
  const calcTimeUntil = (event: Date) => {
    return event.getTime() - timeNow.getTime()
  }

  const timeMarkers = new Array(24)
    .fill(0)
    .map((v, idx) => {
      const tOffset = idx * 60 * 60 * 1000
      return new Date(conferenceStart.getTime() + tOffset)
    })
    .map((t) => {
      if (typeof agendaArea === 'undefined') {
        return null
      }
      const tableHeight = agendaArea.height

      const timeUntil = calcTimeUntil(t)
      if (timeUntil < -currentExtent / 12) {
        return null
      }
      const relOffset = 1 / 12
      const relStart = timeUntil / currentExtent + relOffset
      return {
        time: t,
        timeString: dateToString(t.toUTCString()),
        position: relStart * tableHeight
      }
    })
    .map((tMark) => {
      if (tMark === null) {
        return null
      }
      return (
        <span
          style={{
            position: 'absolute',
            display: 'inline',
            top: `calc(${tMark?.position}px - 0.75em)`,
            left: '0.5ch'
          }}
          key={tMark.timeString}
        >
          {tMark.timeString}
        </span>
      )
    })
    .filter((t) => t !== null)

  const itemsToRender = presentationSlots
    .map((p, idx, arr) => {
      if (typeof agendaArea === 'undefined') {
        return null
      }
      const tableHeight = agendaArea.height
      const tableWidth = agendaArea.width // * 0.85

      const timeUntil = calcTimeUntil(p.startTime)
      const timeSince = timeNow.getTime() - p.endTime.getTime()
      if (
        timeUntil > (currentExtent * 11) / 12 ||
        timeSince > (currentExtent * 1) / 12
      ) {
        // Out of view, don't render
        return null
      }
      const relOffset = 1 / 12
      const relStart = timeUntil / currentExtent + relOffset
      const relEnd = (-1 * timeSince) / currentExtent + relOffset
      const presentationHeight = (relEnd - relStart) * tableHeight
      const overlappingPresentations = arr.filter(
        (a) =>
          a.startTime.getTime() < p.endTime.getTime() &&
          a.endTime.getTime() > p.startTime.getTime()
      )
      const width = tableWidth / overlappingPresentations.length
      const thisIndex = overlappingPresentations.findIndex(
        (a) => a.link === p.link
      )
      const left = thisIndex * width
      return (
        <a href={p.link} key={p.link}>
          <div
            className='absolute flex justify-center text-center items-center bg-secondaryc bg-clip-content p-[1px] text-white overflow-ellipsis'
            style={{
              top: relStart * tableHeight,
              left: left,
              width: width,
              height: presentationHeight
            }}
          >
            <span className='m-auto px-[1.5ch]'>
              {/* {`${p.title} (${dateToString(
                p.startTime.toUTCString()
              )} - ${dateToString(p.endTime.toUTCString())})`} */}
              {p.title}
            </span>
          </div>
        </a>
      )
    })
    .filter((e) => e !== null)

  return (
    <>
      <p>{`Time now: ${dateToString(timeNow.toUTCString())}`}</p>
      <div className='relative flex w-full h-[90%] overflow-hidden mb-5 box-content border-primaryc border-2'>
        <div className='relative w-[6ch] border-1 border-primaryc'>
          {timeMarkers}
        </div>
        <div
          id='presentations'
          className='flex-grow relative box-border'
          ref={dataColumnRef}
        >
          {itemsToRender}
          <div
            className='h-px border-[0.2px] border-red-600 absolute box-border border-dashed border-opacity-50'
            style={{
              left: '-0.5ch',
              width: 'calc(100% + 0.5ch)',
              top: (agendaArea?.height ?? 0) * (1 / 12) // will need changing for scroll
            }}
          />
        </div>
        <FakeScrollbar visibleFraction={hoursToShow / 24} onScroll={(num) => {
          console.log(num)
        }}/>
      </div>
    </>
  )
}

export default AgendaTestPage

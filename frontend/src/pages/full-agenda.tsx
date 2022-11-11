import useSWR, { Fetcher } from 'swr'
import { supabase } from '@/lib/supabaseClient'
import type { PresentationYear } from '@/Components/PresentationSummary'
import { logErrorToDb } from '@/lib/utils'

import { Agenda, ScheduledAgendaEntry } from '@/Components/Agenda/Agenda'
import { useEffect, useState } from 'react'

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

const FullAgenda = (): JSX.Element => {
  const thisYear = '2022'
  const {
    data: fullAgenda,
    error: agendaError,
    isValidating: loadingAgenda
  } = useSWR(thisYear, agendaFetcher)
  const unableToRenderElem = (
    <p>Unable to load this year&apos;s agenda. Please try again later.</p>
  )
  const [hoursToShow, setHoursToShow] = useState(4.5)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHoursToShow(window.matchMedia("(min-width: 768px)").matches ? 12 : 4.5)
    }
  }, [window])

  if (agendaError !== null && typeof agendaError !== 'undefined') {
    logErrorToDb((agendaError as Error).message, 'error')
    return unableToRenderElem
  }
  if (loadingAgenda) {
    return <p>Loading...</p>
  }
  if (typeof fullAgenda === 'undefined') {
    return unableToRenderElem
  }
  const conferenceStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))
  
  if (typeof window !== 'undefined') {
    window.matchMedia("(min-width: 768px)").addEventListener('change', (e) => {
      setHoursToShow(e.matches ? 12 : 4.5)
    })
  }

  return (
    <>
      <div className='mb-2'>
        <p>
          We&apos;re finalizing this page now - the authoritative agenda can be
          found at the{' '}
          <a
            href='https://hopin.com/events/gla-summit-2022'
            className='underline'
          >
            Event page on Hopin
          </a>
        </p>
        <p>
          Times shown in both this agenda and the Hopin page are in your local
          timezone.
        </p>
        <p>
          We apologize that this page is difficult to use on mobile devices - in particular, you need to tap the scrollbar to scroll.
        </p>
      </div>
      <div className={`px-4 max-sm:h-[80vh] max-sm:mb-[5vh] h-5/6`}>
      <Agenda
        agendaEntries={fullAgenda}
        hoursToShow={hoursToShow}
        startDate={conferenceStart}
        durationInHours={24}
      />
      </div>
    </>
  )
}

export default FullAgenda

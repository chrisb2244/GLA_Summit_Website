import useSWR, { Fetcher } from 'swr'
import { supabase } from '@/lib/supabaseClient'
import type { PresentationYear } from '@/Components/PresentationSummary'
import { logErrorToDb } from '@/lib/utils'

import { Agenda, ScheduledAgendaEntry } from '@/Components/Agenda/Agenda'

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
      </div>
      <Agenda
        agendaEntries={fullAgenda}
        hoursToShow={4.5}
        startDate={conferenceStart}
        durationInHours={24}
      />
    </>
  )
}

export default FullAgenda

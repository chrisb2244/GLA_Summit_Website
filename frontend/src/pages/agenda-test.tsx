import useSWR, { Fetcher } from 'swr'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'
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

// This requires a user
// const keyPrefix = 'agenda-'
// const myAgendaFetcher: Fetcher<{}> = async (key: string | null) => {
//   if (key === null) {
//     throw new Error('Cannot load personalized agenda without user')
//   }
//   const userId = key.slice(keyPrefix.length)
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', userId)
//     .single()
//   if (error) {
//     throw error
//   }
//   return data
// }

const AgendaTestPage = () => {
  const { user } = useSession()
  // const key = user ? keyPrefix + user.id : null

  const thisYear = '2021'
  const {
    data: fullAgenda,
    error: agendaError,
    isValidating: loadingAgenda
  } = useSWR(thisYear, agendaFetcher)
  // const { data: personalizedAgenda, error: myAgendaError, isValidating, mutate } = useSWR(key, myAgendaFetcher)

  const unableToRenderElem = (
    <p>Unable to load this year&apos;s agenda. Please try again later.</p>
  )

  if (agendaError !== null && typeof agendaError !== 'undefined') {
    logErrorToDb((agendaError as Error).message, 'error', user?.id)
    return unableToRenderElem
  }
  if (loadingAgenda) {
    return <p>Loading...</p>
  }
  if (typeof fullAgenda === 'undefined') {
    return unableToRenderElem
  }
  const conferenceStart = new Date(Date.UTC(2021, 10, 15, 12, 0, 0))

  return (
    <Agenda
      agendaEntries={fullAgenda}
      hoursToShow={4.5}
      startDate={conferenceStart}
      durationInHours={24}
    />
  )
}

export default AgendaTestPage

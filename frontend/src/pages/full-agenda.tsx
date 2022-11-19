import { supabase } from '@/lib/supabaseClient'
import {
  Agenda,
  AgendaEntry,
  ScheduledAgendaEntry
} from '@/Components/Agenda/Agenda'
import { useEffect, useReducer, useState } from 'react'
import { GetStaticProps } from 'next'
import { useSession } from '@/lib/sessionContext'
import { myLog } from '@/lib/utils'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/sb_databaseModels'
import { PresentationYear } from '@/Components/PresentationSummary'
import { ContainerHint } from '@/Components/Agenda/AgendaCalculations'

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['agenda_favourites']['Row']
>
type SubscriptionEvent =
  | DB_SubscriptionEvent
  | { eventType: 'INITIALIZE'; data: string[] }

export const getStaticProps: GetStaticProps = async () => {
  const returnVal = (agenda: AgendaEntry[] | null, containerHints?: ContainerHint[]) => {
    return {
      props: {
        fullAgenda: agenda as ScheduledAgendaEntry[],
        containerHints
      },
      revalidate: 300
    }
  }
  const year: PresentationYear = '2022'

  const { data: agenda, error } = await supabase
    .from('all_presentations')
    .select('*')
    .eq('year', year)
    .not('scheduled_for', 'is', 'null') // required for ScheduledAgendaEntry rather than AgendaEntry

  if (error) return returnVal(null)

  const { data: containerRows, error: containerError } = await supabase
    .from('container_groups')
    .select('*')

  if (containerError) return returnVal(agenda)

  // "relevant containers" are the containers that include a presentation in the agenda (i.e. this year)
  const presentationIds = agenda.map((p) => p.presentation_id)
  const relevantContainerRows = containerRows.filter((cr) =>
    presentationIds.includes(cr.presentation_id)
  )
  const relevantContainerIds = Array.from(
    new Set(relevantContainerRows.map((cr) => cr.container_id))
  )

  const { data: containers, error: containerPresError } = await supabase
    .from('presentation_submissions')
    .select('*')
    .in('id', relevantContainerIds)

  if (containerPresError) return returnVal(agenda)

  const containerHints = containers.map(
    (c): ContainerHint => {
      const presentationIdsInContainer = relevantContainerRows
        .filter((row) => row.container_id === c.id)
        .map((row) => row.presentation_id)

      return {
        title: c.title,
        abstract: c.abstract,
        container_id: c.id,
        presentation_ids: presentationIdsInContainer,
        year
      }
    }
  )

  return returnVal(agenda, containerHints)
}

const FullAgenda = (props: {
  fullAgenda: ScheduledAgendaEntry[] | null
  containerHints?: ContainerHint[]
}): JSX.Element => {
  const fullAgenda = props.fullAgenda
  const unableToRenderElem = (
    <p>Unable to load this year&apos;s agenda. Please try again later.</p>
  )
  const [hoursToShow, setHoursToShow] = useState(4.5)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHoursToShow(window.matchMedia('(min-width: 768px)').matches ? 6 : 3)
    }
  }, [])

  const { user } = useSession()

  const favouriteReducer = (
    cachedFavourites: string[],
    payload: SubscriptionEvent
  ) => {
    switch (payload.eventType) {
      case 'INITIALIZE':
        return payload.data
      case 'INSERT':
        return cachedFavourites.concat(payload.new.presentation_id)
      case 'UPDATE':
        // probably doesn't happen?
        return cachedFavourites
      case 'DELETE':
        return cachedFavourites.filter((f) => f !== payload.old.presentation_id)
    }
  }

  const [userFavIds, setUserFavs] = useReducer(favouriteReducer, [])

  useEffect(() => {
    // If not signed in, should return empty array
    if (user === null) {
      return
    }
    try {
      supabase
        .from('agenda_favourites')
        .select('presentation_id')
        .then(({ data, error }) => {
          if (error) throw error
          return data.map((r) => r.presentation_id)
        })
        .then((favourites) => {
          setUserFavs({ eventType: 'INITIALIZE', data: favourites })
        })
    } catch (err) {
      return
    }
  }, [user])

  useEffect(() => {
    myLog('adding subscription')
    const subscription = supabase
      .channel('public:agenda_favourites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agenda_favourites'
        },
        (payload: DB_SubscriptionEvent) => {
          setUserFavs(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (fullAgenda === null) {
    return unableToRenderElem
  }
  const conferenceStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))

  if (typeof window !== 'undefined') {
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
      setHoursToShow(e.matches ? 6 : 3)
    })
  }

  const showFavourites = false
  const favouriteIds = showFavourites ? userFavIds : undefined

  return (
    <>
      <div className='mb-2 px-4 prose mx-auto'>
        <p>
          Times shown in this agenda are in your local timezone.
        </p>
        <div className='max-sm:block sm:hidden'>
          <p>
            We recommend that you use this page on a wider screen.
          </p>
        </div>
      </div>
      <div className={`px-4 mb-[5vh] `}>
        <Agenda
          agendaEntries={fullAgenda}
          hoursToShow={hoursToShow}
          startDate={conferenceStart}
          durationInHours={24}
          favourites={favouriteIds}
          containerHints={props.containerHints}
        />
      </div>
    </>
  )
}

export default FullAgenda
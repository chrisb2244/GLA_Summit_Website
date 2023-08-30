import {
  PresentationDisplay,
  Schedule
} from '@/Components/Layout/PresentationDisplay'
import { PersonDisplayProps } from '@/Components/PersonDisplay'
import { getPerson, getPublicPresentation } from '@/lib/databaseFunctions'
import { createAnonServerClient } from '@/lib/supabaseClient'
import { getSessionDurationInMinutes } from '@/lib/utils'
import type { NextPage, Route } from 'next'

type PageProps = {
  params: {
    id: string
  }
}

export const revalidate = 600

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const supabase = createAnonServerClient()
  const { data, error } = await supabase
    .from('accepted_presentations')
    .select('id')
  if (error) {
    return []
  }
  return data
}

const PresentationsForYearPage: NextPage<PageProps> = async ({ params }) => {
  const pId = params.id

  const supabase = createAnonServerClient()
  if (typeof pId !== 'string') {
    return null
  }

  const presentation = await getPublicPresentation(pId, supabase).then(
    async (data) => {
      const speakerIds = data.all_presenters
      const presenters: PersonDisplayProps[] = await Promise.all(
        speakerIds.map(async (speakerId) => {
          return {
            ...(await getPerson(speakerId)),
            pageLink: `/presenters/${speakerId}` as Route
          }
        })
      )

      const type = data.presentation_type
      if (type === 'panel') {
        // ToDo - in a future year, fix this rather than being hardcoded
        const isOS = data.title === 'How to make Open-Source more worthwhile?'
        const link = '/panels/' + isOS ? 'open-source' : 'labview-and-python'
        return {
          redirect: {
            destination: link,
            permanent: true
          }
        }
      }
      // Panels, 7x7 for 1h, 'full length' for 45m?
      const sessionDuration = getSessionDurationInMinutes(type) * 60 // duration in seconds

      let schedule: Schedule = {
        sessionStart: null,
        sessionEnd: null
      }

      if (data.scheduled_for !== null) {
        const startDate = new Date(data.scheduled_for)
        const endDate = new Date(startDate.getTime() + sessionDuration * 1000)
        schedule = {
          sessionStart: startDate.toUTCString(),
          sessionEnd: endDate.toUTCString()
        }
      }

      return {
        title: data.title,
        abstract: data.abstract,
        speakers: presenters,
        speakerNames: data.all_presenters_names,
        ...schedule
      }
    }
  )

  if (typeof presentation.redirect != 'undefined') {
  } else {
    return (
      <PresentationDisplay
        presentationId={pId}
        presentation={presentation}
        withFavouritesButton={false}
      />
    )
  }
}

export default PresentationsForYearPage

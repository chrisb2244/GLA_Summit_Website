import type { GetStaticPaths, GetStaticProps } from 'next'
import type { PersonDisplayProps } from '@/Components/PersonDisplay'
import { useSession } from '@/lib/sessionContext'
import type { Presentation, Schedule } from '@/Components/Layout/PresentationDisplay'
import { PresentationDisplay } from '@/Components/Layout/PresentationDisplay'
import {
  getAcceptedPresentationIds,
  getPerson,
  getPublicPresentation
} from '@/lib/databaseFunctions'

type PresentationProps = {
  presentation: Presentation
  presentationId: string
}

export const getStaticProps: GetStaticProps<PresentationProps> = async ({
  params
}) => {
  const presentationId = params?.presentationId
  if (typeof presentationId !== 'string') {
    return {
      notFound: true
    }
  }

  return await getPublicPresentation(presentationId)
    .then(async (data) => {
      const speakerIds = data.all_presenters
      const presenters: PersonDisplayProps[] = await Promise.all(
        speakerIds.map(async (id) => {
          return {
            ...(await getPerson(id)),
            pageLink: `/presenters/${id}`
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
      const sessionDuration = (
        type === 'full length' ? 45 : 
        type === '15 minutes' ? 15 : 
        type === '7x7' ? 7 :
        type === 'quiz' ? 30 :
        type === 'panel' ? 60 :
        60) * 60 // duration in seconds

      let schedule: Schedule = {
        sessionStart: null,
        sessionEnd: null
      }

      if (data.scheduled_for !== null) {
        const startDate = new Date(data.scheduled_for)
        const endDate = new Date(
          startDate.getTime() + sessionDuration * 1000
        )
        schedule = {
          sessionStart: startDate.toUTCString(),
          sessionEnd: endDate.toUTCString()
        }
      }

      return {
        props: {
          presentation: {
            title: data.title,
            abstract: data.abstract,
            speakers: presenters,
            speakerNames: data.all_presenters_names,
            ...schedule
          },
          presentationId
        },
        revalidate: 3600
      }
    })
    .catch(() => {
      return { notFound: true }
    })
}

export const getStaticPaths: GetStaticPaths = async () => {
  const panelIds = [
    'e65a01e9-65a0-4687-8825-004efc24bb7a', // open-source
    '3d12f1c1-e99b-46c0-8188-3f4055e6580b' // python
  ]
  const presentationIdArray = await getAcceptedPresentationIds().then((ids) =>
    ids
    .filter(id => ! panelIds.includes(id))
    .map((id) => '/presentations/' + id)
  )

  return {
    paths: presentationIdArray,
    fallback: 'blocking'
  }
}

const PresentationPage = ({ presentation, presentationId }: PresentationProps) => {
  const {
    timezoneInfo: { timeZone, timeZoneName, use24HourClock }
  } = useSession()
  const dateToString = (utcDateString: string) => {
    const date = new Date(utcDateString)
    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: undefined,
      dateStyle: undefined,
      hour12: use24HourClock === false
    })
    return formatter.format(date)
  }

  return (
    <PresentationDisplay
      presentationId={presentationId}
      dateToStringFn={dateToString}
      presentation={presentation}
      timeZoneName={timeZoneName}
    />
  )
}

export default PresentationPage

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
      // Panels, 7x7 for 1h, 'full length' for 45m?
      const sessionDuration = type === 'full length' ? 45 * 60 : 60 * 60 // duration in seconds

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
  const presentationIdArray = await getAcceptedPresentationIds().then((ids) =>
    ids.map((id) => '/presentations/' + id)
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

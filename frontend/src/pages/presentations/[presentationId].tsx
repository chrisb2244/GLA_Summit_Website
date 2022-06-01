import type { GetStaticPaths, GetStaticProps } from 'next'
import type { PersonDisplayProps } from '@/Components/PersonDisplay'
import { useSession } from '@/lib/sessionContext'
import type { Presentation } from '@/Components/Layout/PresentationDisplay'
import { PresentationDisplay } from '@/Components/Layout/PresentationDisplay'
import {
  getAcceptedPresentationIds,
  getPerson,
  getPublicPresentation
} from '@/lib/databaseFunctions'

type PresentationProps = {
  presentation: Presentation
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
            ...getPerson(id),
            pageLink: `/presenters/${id}`
          }
        })
      )

      const type = data.presentation_type
      // Panels, 7x7 for 1h, 'full length' for 45m?
      const sessionDuration = type === 'full length' ? 45 * 60 : 60 * 60 // duration in seconds
      const startDate = new Date(data.scheduled_for)
      const sessionStart = startDate.toUTCString()
      const sessionEnd = new Date(
        startDate.getTime() + sessionDuration * 1000
      ).toUTCString()

      return {
        props: {
          presentation: {
            title: data.title,
            abstract: data.abstract,
            speakers: presenters,
            speakerNames: data.all_presenters_names,
            sessionStart,
            sessionEnd
          }
        }
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

const PresentationPage = ({ presentation }: PresentationProps) => {
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

  const startTime = dateToString(presentation.sessionStart)
  const endTime = dateToString(presentation.sessionEnd)

  return (
    <PresentationDisplay
      startTime={startTime}
      endTime={endTime}
      presentation={presentation}
      timeZoneName={timeZoneName}
    />
  )
}

export default PresentationPage

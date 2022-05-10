import { supabase } from '@/lib/supabaseClient'
import type { GetStaticPaths, GetStaticProps } from 'next'
import type { AllPresentationsModel, ProfileModel } from '@/lib/databaseModels'
import { Box, Paper, Typography } from '@mui/material'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonProps } from '@/Components/PersonDisplay'
import { useSession } from '@/lib/sessionContext'

type Presentation = {
  title: string
  abstract: string
  speakerNames: string[]
  speakers: PersonProps[]
  sessionStart: string
  sessionEnd: string
}

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

  const { data, error } = await supabase
    .from<AllPresentationsModel>('all_presentations')
    .select('*')
    .eq('presentation_id', presentationId)
    .single()

  if (error) {
    return {
      notFound: true
    }
  }

  const speakerIds = data.all_presenters
  const presenters: PersonProps[] = await Promise.all(
    speakerIds.map(async (id) => {
      const { data: presenterInfo, error: presenterError } = await supabase
        .from<ProfileModel>('profiles')
        .select()
        .eq('id', id)
        .single()
      if (presenterError) throw presenterError

      const getAvatarPublicUrl = (userAvatarUrl: string) => {
        const { error, publicURL } = supabase.storage
          .from('avatars')
          .getPublicUrl(userAvatarUrl)
        if (error) throw error
        return publicURL
      }

      const avatarUrl = presenterInfo.avatar_url
        ? getAvatarPublicUrl(presenterInfo.avatar_url)
        : null
      return {
        firstName: presenterInfo.firstname,
        lastName: presenterInfo.lastname,
        description: presenterInfo.bio ?? '',
        image: avatarUrl,
        createPageLink: `/presenters/${presenterInfo.id}`
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
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data, error } = await supabase
    .from('accepted_presentations')
    .select('id')
  if (error) throw error
  const presentationIdArray = data.map((p) => {
    return '/presentations/' + p.id
  })

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
    <Paper>
      <StackedBoxes>
        <Box width={{ xs: '100%', md: '95%' }} marginX='auto'>
          <Typography variant='h3' gutterBottom>
            {presentation.title}
          </Typography>
          <Typography variant='subtitle1' fontStyle='italic'>
            {`${startTime} - ${endTime} (${timeZoneName})`}
          </Typography>
          <Box>
            {presentation.abstract.split('\r\n').map((p, idx) => {
              return <Typography key={`p${idx}`}>{p}</Typography>
            })}
          </Box>
        </Box>
        {presentation.speakers.map((personProps) => {
          return (
            <PersonDisplay
              {...personProps}
              stripContainer
              key={personProps.lastName}
            />
          )
        })}
      </StackedBoxes>
    </Paper>
  )
}

export default PresentationPage

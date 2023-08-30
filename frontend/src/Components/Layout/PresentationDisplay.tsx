'use client'
import { Paper, Box, Typography } from '@mui/material'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { StackedBoxes } from './StackedBoxes'
import { mdiCalendar, mdiStarPlusOutline, mdiStarRemoveOutline } from '@mdi/js'
import Icon from '@mdi/react'
import { useEffect, useState } from 'react'
import { logErrorToDb } from '@/lib/utils'
import {
  User,
  createClientComponentClient
} from '@supabase/auth-helpers-nextjs'
import { TimestampSpan } from '../Utilities/TimestampSpan'

export type Presentation = {
  title: string
  abstract: string
  speakerNames: string[]
  speakers: PersonDisplayProps[]
} & Schedule

export type Schedule =
  | {
      sessionStart: string
      sessionEnd: string
    }
  | {
      sessionStart: null
      sessionEnd: null
    }

type PresentationDisplayProps = {
  presentation: Presentation
  presentationId: string
  withFavouritesButton?: boolean
}

export const PresentationDisplay: React.FC<
  React.PropsWithChildren<PresentationDisplayProps>
> = (props) => {
  const { presentation, presentationId, withFavouritesButton = true } = props
  const supabase = createClientComponentClient()

  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      if (res.error !== null) {
        return
      }
      setUser(res.data.user)
    })
  }, [])
  const showFavouritesButton = withFavouritesButton && user !== null

  const [isFavourite, setFavourite] = useState(false)
  useEffect(() => {
    supabase
      .from('agenda_favourites')
      .select('*')
      .eq('presentation_id', presentationId)
      .then(({ data, error }) => {
        if (error) {
          return
        }
        setFavourite(data !== null && data.length !== 0)
      })
  }, [presentationId])

  let scheduleInfo = <></>
  if (presentation.sessionStart !== null) {
    scheduleInfo = (
      <TimestampSpan
        utcValue={{
          start: presentation.sessionStart,
          end: presentation.sessionEnd
        }}
        dateFormat={{
          month: 'long',
          day: '2-digit'
        }}
      />
    )
  }

  const downloadButton = (
    <a href={`/api/ics/${presentationId}`} target='_blank' rel='noreferrer'>
      <div className='flex flex-row items-center'>
        <Icon path={mdiCalendar} size={1} />
        <span className='prose pl-1'>Download ICS file</span>
      </div>
    </a>
  )

  const handleFavouriteClick = () => {
    if (user === null) {
      return
    }
    if (isFavourite) {
      // Remove from favourites
      supabase
        .from('agenda_favourites')
        .delete()
        .eq('presentation_id', presentationId)
        .then(({ error }) => {
          if (error) {
            logErrorToDb(error.message, 'error', user.id)
          }
        })
    } else {
      // Add to favourites
      supabase
        .from('agenda_favourites')
        .insert({
          presentation_id: presentationId,
          user_id: user.id
        })
        .then(({ error }) => {
          if (error) {
            logErrorToDb(error.message, 'error', user.id)
          }
        })
    }
    setFavourite(!isFavourite)
  }

  const favouriteButton = showFavouritesButton ? (
    <div
      className='mb-2 flex w-[fit-content] cursor-pointer flex-row rounded bg-secondaryc'
      onClick={() => handleFavouriteClick()}
    >
      <Icon
        path={isFavourite ? mdiStarRemoveOutline : mdiStarPlusOutline}
        size={1}
        className='m-2'
      />
      <span className='m-2 mr-3'>
        {isFavourite ? 'Remove from my agenda' : 'Add to my agenda'}
      </span>
    </div>
  ) : null

  return (
    <Paper>
      <StackedBoxes>
        <Box width={{ xs: '100%', md: '95%' }} marginX='auto' mt={1}>
          <Typography variant='h3' gutterBottom>
            {presentation.title}
          </Typography>
          <div className='flex flex-col py-2 md:flex-row md:justify-between'>
            {scheduleInfo}
            {downloadButton}
          </div>
          {favouriteButton}
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
              useDefaultIconImage
              key={`${personProps.lastName}_${personProps.firstName}`}
            />
          )
        })}
      </StackedBoxes>
    </Paper>
  )
}

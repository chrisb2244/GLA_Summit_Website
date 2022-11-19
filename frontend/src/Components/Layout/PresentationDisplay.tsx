import { Paper, Box, Typography } from '@mui/material'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { StackedBoxes } from './StackedBoxes'
import { mdiCalendar, mdiStarPlusOutline, mdiStarRemoveOutline } from '@mdi/js'
import Icon from '@mdi/react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'
import { logErrorToDb } from '@/lib/utils'

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
  timeZoneName: string
  presentationId: string
  dateToStringFn: (datetime: string) => string
  withFavouritesButton?: boolean
}

export const PresentationDisplay: React.FC<PresentationDisplayProps> = (
  props
) => {
  const { presentation, timeZoneName, dateToStringFn, presentationId } = props
  const showFavouritesButton = props.withFavouritesButton ?? true

  const { user } = useSession()

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
    const startTime = dateToStringFn(presentation.sessionStart)
    const endTime = dateToStringFn(presentation.sessionEnd)
    scheduleInfo = (
      <Typography variant='subtitle1' fontStyle='italic'>
        {`${startTime} - ${endTime} (${timeZoneName})`}
      </Typography>
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

  const favouriteButton = showFavouritesButton && user !== null ? (
      <div
        className='flex flex-row bg-secondaryc rounded w-[fit-content] mb-2 cursor-pointer'
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
          <div className='py-2 flex flex-col md:flex-row md:justify-between'>
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
              key={`${personProps.lastName}_${personProps.firstName}`}
            />
          )
        })}
      </StackedBoxes>
    </Paper>
  )
}

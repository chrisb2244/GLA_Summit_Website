import { Paper, Box, Typography } from '@mui/material'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { StackedBoxes } from './StackedBoxes'
import { mdiCalendar } from '@mdi/js'
import Icon from '@mdi/react'

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
}

export const PresentationDisplay: React.FC<PresentationDisplayProps> = (
  props
) => {
  const { presentation, timeZoneName, dateToStringFn, presentationId } = props
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

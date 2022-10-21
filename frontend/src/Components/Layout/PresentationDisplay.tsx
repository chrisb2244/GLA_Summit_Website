import { Paper, Box, Typography } from '@mui/material'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { StackedBoxes } from './StackedBoxes'

export type Presentation = {
  title: string
  abstract: string
  speakerNames: string[]
  speakers: PersonDisplayProps[]
} & Schedule 

export type Schedule = ({
  sessionStart: string
  sessionEnd: string
} | {
  sessionStart: null
  sessionEnd: null
})

type PresentationDisplayProps = {
  presentation: Presentation
  timeZoneName: string
  dateToStringFn: (datetime: string) => string
}

export const PresentationDisplay: React.FC<PresentationDisplayProps> = (
  props
) => {
  const { presentation, timeZoneName, dateToStringFn } = props
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
  return (
    <Paper>
      <StackedBoxes>
        <Box width={{ xs: '100%', md: '95%' }} marginX='auto' mt={1}>
          <Typography variant='h3' gutterBottom>
            {presentation.title}
          </Typography>
          {scheduleInfo}
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

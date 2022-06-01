import { Paper, Box, Typography } from '@mui/material'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { StackedBoxes } from './StackedBoxes'

export type Presentation = {
  title: string
  abstract: string
  speakerNames: string[]
  speakers: PersonDisplayProps[]
  sessionStart: string
  sessionEnd: string
}

type PresentationDisplayProps = {
  presentation: Presentation
  startTime: string
  endTime: string
  timeZoneName: string
}

export const PresentationDisplay: React.FC<PresentationDisplayProps> = (props) => {
  const { presentation, startTime, endTime, timeZoneName } = props
  return (
    <Paper>
      <StackedBoxes>
        <Box width={{ xs: '100%', md: '95%' }} marginX='auto' mt={1}>
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

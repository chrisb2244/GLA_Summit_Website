import { Box, Paper, Typography } from '@mui/material'

export type Presentation = {
  title: string
  abstract: string
  speakers: string | string[]
}

export type PresentationProps = {
  presentation: Presentation
}

export const PresentationSummary: React.FC<PresentationProps> = ({
  presentation: pres
}) => {
  const speakerLine = Array.isArray(pres.speakers)
    ? pres.speakers.join(', ')
    : pres.speakers
  return (
    <Paper>
      <Box p={2}>
        <Typography variant='h6'>{pres.title}</Typography>
        <Typography variant='subtitle1' fontStyle='italic'>
          {speakerLine}
        </Typography>
        <Box
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 7,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {pres.abstract.split('\r\n').map((p, idx) => {
            return <Typography key={`p${idx}`}>{p}</Typography>
          })}
        </Box>
      </Box>
    </Paper>
  )
}

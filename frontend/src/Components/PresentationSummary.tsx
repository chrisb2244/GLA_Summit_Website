import { Box, Paper, Typography } from '@mui/material'

export type Presentation = {
  title: string
  abstract: string
}

export type PresentationProps = {
  presentation: Presentation
}

export const PresentationSummary: React.FC<PresentationProps> = (props) => {
  return (
    <Paper>
      <Box p={2}>
        <Typography variant='h6'>{props.presentation.title}</Typography>
        {props.presentation.abstract.split('\r\n').map((p, idx) => {
          return <Typography key={`p${idx}`}>{p}</Typography>
        })}
      </Box>
    </Paper>
  )
}

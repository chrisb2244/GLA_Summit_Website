'use client'
import { Box, Paper, PaperProps, Typography } from '@mui/material'
import { PresentationType, SummitYear } from '@/lib/databaseModels'
import Link from 'next/link'
import { TimestampSpan } from './Utilities/TimestampSpan'

export type Presenter = {
  firstname: string
  lastname: string
}
export type Presentation = {
  title: string
  abstract: string
  speakers: Presenter | Presenter[]
  speakerNames: string | string[]
  presentationId: string
  year: SummitYear
  scheduledFor: string | null
  presentationType: PresentationType
}

export type PresentationProps = {
  presentation: Presentation
  paperProps?: PaperProps
}

export const PresentationSummary = (props: PresentationProps) => {
  const { presentation: pres, paperProps } = props

  const speakerLine = Array.isArray(pres.speakerNames)
    ? pres.speakerNames.join(', ')
    : pres.speakerNames

  // prettier-ignore
  const durationElem = (
    <Typography variant='subtitle2' fontStyle='italic'>
      {
        pres.presentationType === "full length" ? '45 minutes' :
        pres.presentationType === "15 minutes" ? '15 minutes' :
        pres.presentationType === "7x7" ? '7 minutes' :
        pres.presentationType === 'panel' ? 'Panel discussion' :
        'Quiz'
      }
    </Typography>
  )

  return (
    <Paper {...paperProps}>
      <Box p={2}>
        <Link href={`/presentations/${pres.presentationId}`}>{pres.title}</Link>
        <Typography variant='subtitle1' fontStyle='italic'>
          {speakerLine}
        </Typography>
        <TimestampSpan utcValue={pres.scheduledFor} />
        {durationElem}
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

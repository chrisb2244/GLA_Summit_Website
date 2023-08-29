'use client'
import { Box, Paper, PaperProps, Typography } from '@mui/material'
import { Database } from '@/lib/sb_databaseModels'
import { PresentationType } from '@/lib/databaseModels'
import { useSession } from '@/lib/sessionContext'
import Link from 'next/link'
import type { Route } from 'next'

export type Presenter = {
  firstname: string
  lastname: string
}
export type PresentationYear = Database['public']['Enums']['summit_year']
export type Presentation = {
  title: string
  abstract: string
  speakers: Presenter | Presenter[]
  speakerNames: string | string[],
  presentationId: string
  year: PresentationYear
  scheduledFor: string | null
  presentationType: PresentationType
}

export type PresentationProps<T extends string> = {
  presentation: Presentation
  pageLink: Route<T>
  paperProps?: PaperProps
}

export function PresentationSummary<T extends string>({presentation: pres, pageLink, paperProps}: PresentationProps<T>) {
  const speakerLine = Array.isArray(pres.speakerNames)
    ? pres.speakerNames.join(', ')
    : pres.speakerNames
  // const {
  //     timezoneInfo: { timeZone, timeZoneName, use24HourClock }
  // } = useSession()
  const timeZone = 'UTC'; const use24HourClock = true; const timeZoneName = 'UTC';
  const dateToString = (utcDateString: string) => {
    const date = new Date(utcDateString)
    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: undefined,
      dateStyle: undefined,
      hour12: !use24HourClock
    })
    return formatter.format(date)
  }

  const scheduleLine = pres.scheduledFor !== null ? (
    dateToString(pres.scheduledFor) + ` ${timeZoneName}`
  ) : null

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

  const TitleComponent: React.FC<React.PropsWithChildren<{link?: Route}>> = ({ link, children }) => {
    if (typeof link !== 'undefined') {
      return (
        <Link href={link}>
          {children}
        </Link>
      )
    } else {
      return <Typography variant='h6'>{children}</Typography>
    }
  }

  return (
    <Paper {...paperProps}>
      <Box p={2}>
        <TitleComponent >{pres.title}</TitleComponent>
        <Typography variant='subtitle1' fontStyle='italic'>
          {speakerLine}
        </Typography>
        <Typography variant='subtitle2' fontStyle='italic'>
          {scheduleLine}
        </Typography>
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

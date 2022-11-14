import { Box, Paper, PaperProps, Typography } from '@mui/material'
import { Link } from '@/lib/link'
import type { LinkProps } from '@/lib/link'
import { Database } from '@/lib/sb_databaseModels'
import { PresentationType } from '@/lib/databaseModels'
import { useSession } from '@/lib/sessionContext'

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

export type PresentationProps = {
  presentation: Presentation
  pageLink?: string
  paperProps?: PaperProps
}

export const PresentationSummary: React.FC<PresentationProps> = ({
  presentation: pres,
  pageLink,
  paperProps
}) => {
  const speakerLine = Array.isArray(pres.speakerNames)
    ? pres.speakerNames.join(', ')
    : pres.speakerNames
  const {
      timezoneInfo: { timeZone, timeZoneName, use24HourClock }
  } = useSession()
  const dateToString = (utcDateString: string) => {
    const date = new Date(utcDateString)
    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: undefined,
      dateStyle: undefined,
      hour12: false
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

  const TitleComponent: React.FC<LinkProps> = ({ children, ...props }) => {
    if (typeof pageLink !== 'undefined') {
      return (
        <Link href={pageLink} {...props}>
          {children}
        </Link>
      )
    } else {
      return <Typography {...props}>{children}</Typography>
    }
  }

  return (
    <Paper {...paperProps}>
      <Box p={2}>
        <TitleComponent variant='h6'>{pres.title}</TitleComponent>
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

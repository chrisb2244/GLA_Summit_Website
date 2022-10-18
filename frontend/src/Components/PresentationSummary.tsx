import { Box, Paper, PaperProps, Typography } from '@mui/material'
import { Link } from '@/lib/link'
import type { LinkProps } from '@/lib/link'
import { Database } from '@/lib/sb_databaseModels'

export type PresentationYear = Database['public']['Enums']['summit_year']
export type Presentation = {
  title: string
  abstract: string
  speakers: string | string[]
  presentationId: string
  year: PresentationYear
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
  const speakerLine = Array.isArray(pres.speakers)
    ? pres.speakers.join(', ')
    : pres.speakers

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

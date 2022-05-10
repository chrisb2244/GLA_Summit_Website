import { Box, Paper, Typography } from '@mui/material'
import { Link } from '@/lib/link'
import type { LinkProps } from '@/lib/link'

export type Presentation = {
  title: string
  abstract: string
  speakers: string | string[]
  presentationId: string
}

export type PresentationProps = {
  presentation: Presentation
  pageLink?: string
}

export const PresentationSummary: React.FC<PresentationProps> = ({
  presentation: pres,
  pageLink
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
    <Paper>
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

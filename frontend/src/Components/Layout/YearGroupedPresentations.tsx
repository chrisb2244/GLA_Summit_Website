import {
  Presentation,
  PresentationSummary,
  PresentationYear
} from '@/Components/PresentationSummary'
import { ArrowForwardIosSharp } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography
} from '@mui/material'
import { useState } from 'react'

type YearGroupedPresentationsProps = {
  year: PresentationYear
  presentations: Presentation[]
  initiallyOpen?: boolean
  disableAccordion?: boolean
}

export const YearGroupedPresentations: React.FC<
  YearGroupedPresentationsProps
> = ({ year, presentations, initiallyOpen, disableAccordion }) => {
  const [open, setOpen] = useState(initiallyOpen ?? false)

  const renderedPresentations = presentations
  .sort((a, b) => {
    // negative if a < b
    // Returns "smallest" first
    if (b.scheduledFor !== null && a.scheduledFor !== null) {
      return -1 * (new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
    } else if (b.scheduledFor !== null) {
      return 1 // b has a scheduled time, a does not. b first.
    } else if (a.scheduledFor !== null) {
      return -1 // a has a scheduled time, b does not. a first.
    } else {
      const bPrimarySpeaker = Array.isArray(b.speakers) ? b.speakers[0] : b.speakers
      const aPrimarySpeaker = Array.isArray(a.speakers) ? a.speakers[0] : a.speakers
      return -1 * ('' + bPrimarySpeaker.lastname).localeCompare(aPrimarySpeaker.lastname)
    }
  })
  .map((p) => (
    <Box pb={1} key={p.title}>
      <PresentationSummary
        presentation={p}
        pageLink={`/presentations/${p.presentationId}`}
        paperProps={{
          elevation: 2,
          sx: {
            // mx: -0.5
          }
        }}
      />
    </Box>
  ))

  return disableAccordion ? (
    <Box>{renderedPresentations}</Box>
  ) : (
    <Accordion
      key={`presentations-${year}`}
      expanded={open}
      onChange={() => setOpen(!open)}
      defaultExpanded={initiallyOpen}
      TransitionProps={{
        timeout: 150
      }}
    >
      <AccordionSummary
        aria-controls={`presentations-${year}-content`}
        id={`presentations-${year}-header`}
        expandIcon={<ArrowForwardIosSharp sx={{fontSize: '1.5rem'}} />}
        sx={{
          flexDirection: 'row-reverse', // arrow on left
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(90deg)', // rotate when expanded
          },
          '& .MuiAccordionSummary-content': {
            marginLeft: 2, // spacing between arrow and year
          },
        }}
      >
        <Typography variant='h4'>{year} Presentations</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 1.5}}>{renderedPresentations}</AccordionDetails>
    </Accordion>
  )
}

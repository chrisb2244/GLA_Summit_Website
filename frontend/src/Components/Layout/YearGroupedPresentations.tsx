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

  const renderedPresentations = presentations.map((p) => (
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
        expandIcon={<ArrowForwardIosSharp sx={{fontSize: '0.9rem'}} />}
        sx={{
          flexDirection: 'row-reverse', // arrow on left
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(90deg)' // rotate when expanded
          },
          '& .MuiAccordionSummary-content': {
            marginLeft: 1, // spacing between arrow and year
          },
        }}
      >
        <Typography>{year}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px: 1.5}}>{renderedPresentations}</AccordionDetails>
    </Accordion>
  )
}

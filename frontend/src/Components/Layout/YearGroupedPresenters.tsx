import type { SummitYear } from '@/lib/databaseModels'
import { ArrowForwardIosSharp } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography
} from '@mui/material'
import { useState } from 'react'

type YearGroupedPresenterProps = {
  year: SummitYear
  elements: JSX.Element[]
  initiallyOpen?: boolean
  disableAccordion?: boolean
}

export const YearGroupedPresenters: React.FC<YearGroupedPresenterProps> = ({
  year,
  elements,
  initiallyOpen,
  disableAccordion
}) => {
  const [open, setOpen] = useState(initiallyOpen ?? false)

  return disableAccordion ? (
    <Box>{elements}</Box>
  ) : (
    <Accordion
      key={`presenters-${year}`}
      expanded={open}
      onChange={() => setOpen(!open)}
      defaultExpanded={initiallyOpen}
      TransitionProps={{
        timeout: 150
      }}
      elevation={3}
    >
      <AccordionSummary
        aria-controls={`presenters-${year}-content`}
        id={`presenters-${year}-header`}
        expandIcon={<ArrowForwardIosSharp sx={{ fontSize: '1.5rem' }} />}
        sx={{
          flexDirection: 'row-reverse', // arrow on left
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(90deg)' // rotate when expanded
          },
          '& .MuiAccordionSummary-content': {
            marginLeft: 2 // spacing between arrow and year
          },
          '& .MuiAccordionSummary-content.Mui-expanded': {
            // Repeated because otherwise the default margin applies, moving this to the left.
            marginLeft: 2 // spacing between arrow and year
          }
        }}
      >
        <Typography variant='h4'>{year} Presenters</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5 }}>{elements}</AccordionDetails>
    </Accordion>
  )
}

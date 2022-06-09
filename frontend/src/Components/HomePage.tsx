import {
  Box,
  Button,
  Snackbar,
  Typography,
  TypographyProps,
  IconButton
} from '@mui/material'
import { Countdown } from './Countdown'
import { SponsorBar } from './SponsorBar'
import { StackedBoxes } from './Layout/StackedBoxes'
import { Link } from '@/lib/link'
import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'

export const HomePage: React.FC = () => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  const P: React.FC<TypographyProps> = ({ children, ...props }) => {
    return (
      <Typography textAlign='center' {...props}>
        {children}
      </Typography>
    )
  }

  const [snackbarOpen, setSnackbarOpen] = useState(true)

  return (
    <>
      <StackedBoxes>
        <Countdown event_start={eventStart} event_end={eventEnd} />
        <P>
          The GLA Summit Organizers would like to welcome all LabVIEW
          enthusiasts to join us in our third GLA Summit!
          <br />
          The Summit will run between 12:00 UTC, 14<sup>th</sup> and 12:00 UTC,
          15<sup>th</sup> November 2022, for a full 24 hours.
        </P>
        <P>
          This is an exciting opportunity for advanced LabVIEW developers and
          Architects (certified or self-proclaimed) from around the world to
          network and participate in an inclusive, all-digital, free event.
        </P>
        <P>
          Presenters at the GLA Summit will be eligible to receive 30
          recertification points for NI LabVIEW certifications.
          <br />
          Attendees will also be able to receive 20 points.
        </P>
        <Box>
          <Link href={'/submit-presentation'}>
            <Button fullWidth variant='contained'>
              Submit a Presentation Now!
            </Button>
          </Link>
        </Box>
      </StackedBoxes>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        action={
          <>
            <P textAlign='center'>
              The service we use to send emails is currently having technical
              difficulties - if you are unable to signin or register, please try
              again later...
            </P>
            <IconButton
              size='small'
              aria-label='close'
              color='inherit'
              onClick={() => setSnackbarOpen(false)}
            >
              <CloseIcon fontSize='small' />
            </IconButton>
          </>
        }
      />
      <Box my='auto' pb={2}>
        <Box>
          <SponsorBar />
        </Box>
      </Box>
    </>
  )
}

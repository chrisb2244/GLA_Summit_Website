import { Box, Button, Typography } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { Countdown } from './Countdown'
import { SponsorBar } from './SponsorBar'
import { StackedBoxes } from './Layout/StackedBoxes'
import { Link } from '@/lib/link'
// import { SnackbarNotification } from './Utilities/SnackbarNotification'

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

  // const anchorPosition: SnackbarOrigin = {
  //   horizontal: 'center',
  //   vertical: 'bottom'
  // }

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
          <Link href={'https://hopin.com/events/gla-summit-2022'}>
            <Button fullWidth variant='contained' className='bg-primaryc'>
              Register for a ticket at Hopin
            </Button>
          </Link>
        </Box>
        {/* <Box>
          <Link href={'/submit-presentation'}>
            <Button fullWidth variant='contained'>
              Submit a Presentation Now!
            </Button>
          </Link>
        </Box> */}
      </StackedBoxes>
      {/* <SnackbarNotification open anchorOrigin={anchorPosition}>
        <P textAlign='center'>
          Our presentation submission process is closing today.
        </P>
        <P textAlign='center'>
          If you are considering submitting a presentation, please do so now!
        </P>
      </SnackbarNotification> */}
      <Box my='auto' pb={2}>
        <Box>
          <SponsorBar />
        </Box>
      </Box>
    </>
  )
}

import { Box, Button, Typography, TypographyProps } from '@mui/material'
import { Countdown } from './Countdown'
import { SponsorBar } from './SponsorBar'
import { StackedBoxes } from './Layout/StackedBoxes'
import { Link } from '@/lib/link'

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

  return (
    <>
      <StackedBoxes>
        <Countdown event_start={eventStart} event_end={eventEnd} />
        <P>
          In collaboration with the Certified LabVIEW Architect community and
          NI, we&apos;d like to welcome all LabVIEW enthusiasts to join us in
          our third Global LabVIEW Architects&apos; Summit!
        </P>
        <P>
          This is an exciting opportunity for advanced LabVIEW developers and
          Architects (certified or self-proclaimed) from around the world to
          network and participate in a more inclusive, all-digital, free event.
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
      <Box my='auto' pb={2}>
        <Box>
          <SponsorBar />
        </Box>
      </Box>
    </>
  )
}

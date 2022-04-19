import { Stack, Typography } from '@mui/material'
import { Countdown } from './Countdown'

export const HomePage: React.FC = () => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))

  return (
    <>
      <Stack>
        <Countdown event_start={eventStart} event_end={eventEnd} />
        <Typography>
          In collaboration with the Certified LabVIEW Architect community and
          NI, we&apos;d like to welcome all LabVIEW Architects (certified or
          self-proclaimed) to join us in our second Global LabVIEW
          Architects&apos; Summit! This is an exciting opportunity for advanced
          LabVIEW developers from around the world to network and participate in
          a more inclusive, all-digital, free event.
        </Typography>
      </Stack>
    </>
  )
}

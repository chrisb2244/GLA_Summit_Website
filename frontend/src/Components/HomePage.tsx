import { Box, Button, Typography } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { Countdown } from './Countdown'
import { StackedBoxes } from './Layout/StackedBoxes'
import { Link } from '@/lib/link'
import NI_Logo from '@/media/NI-Logo.png'
import GCentral_Logo from '@/media/GCentral-logo-color.svg'
import SAS_Logo from '@/media/SAS-Logo.png'
import CorgiBytes_Logo from '@/media/corgibytes-logo.png'
import HeartWare_Dev_Logo from '@/media/heartware-dev-logo.png' // #1e143e_bg
import NextImage, { StaticImageData } from 'next/image'
// import { SnackbarNotification } from './Utilities/SnackbarNotification'

export const HomePage: React.FC = () => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2022, 10, 14, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  const P: React.FC<TypographyProps> = ({ children, ...props }) => {
    return (
      <Typography textAlign='center' {...props} className='prose max-w-none'>
        {children}
      </Typography>
    )
  }

  // const anchorPosition: SnackbarOrigin = {
  //   horizontal: 'center',
  //   vertical: 'bottom'
  // }

  const mainBlock = (
    <StackedBoxes>
      <P>This event has finished!</P>
      <P>
        The GLA Summit Organizers would like to thank all of the LabVIEW
        enthusiasts who joined us for our third GLA Summit!
      </P>
      <P>
        We were excited to welcome advanced LabVIEW developers and Architects
        (certified or self-proclaimed) from around the world to network and
        participate in an inclusive, all-digital, free event.
      </P>
      <P>
        Recordings of all of the presentations will be made available via the{' '}
        <a
          href='https://www.youtube.com/c/GlobalLabVIEWArchitects'
          className='underline'
        >
          GLA Summit YouTube channel
        </a>{' '}
        - we hope that you are as excited as we are to see any presentations you
        missed, or to rewatch for details!
      </P>
      {/* <P>
        Presenters at the GLA Summit will be eligible to receive 30
        recertification points for NI LabVIEW certifications.
        <br />
        Attendees will also be able to receive 20 points.
      </P> */}
      {/* <Box>
        <Link href={'https://hopin.com/events/gla-summit-2022'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            Register for a ticket at Hopin
          </Button>
        </Link>
      </Box> */}
    </StackedBoxes>
  )

  const NI_Block = (
    <Link href='https://www.ni.com' py={2}>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        width='fit-content'
      >
        <Typography
          variant='h5'
          sx={{ fontSize: { md: '2.5rem' }, textAlign: 'center' }}
          px={2}
        >
          Sponsored by NI
        </Typography>
        <NextImage src={NI_Logo} width='180px' height='180px' />
      </Box>
    </Link>
  )

  const gcentralBlock = (
    <Link href={'https://www.gcentral.org/'} py={2}>
      <Box
        display='flex'
        flexDirection='row'
        alignItems='center'
        justifyContent='center'
      >
        <NextImage src={GCentral_Logo} width={90} height={90} />
        <Typography variant='h5' px={2}>
          GCentral
        </Typography>
      </Box>
    </Link>
  )

  const corgiBlock = (
    <Link href={'https://corgibytes.com/'} py={2}>
      <NextImage src={CorgiBytes_Logo} width={275} height={79} />
    </Link>
  )

  const heartwareBlock = (
    <Link href={'https://www.heartware.dev/'} py={2}>
      <div className='bg-[#1e143e]'>
        <NextImage src={HeartWare_Dev_Logo} width={1000} height={250} />
      </div>
    </Link>
  )

  const sasBlock = (
    <Link href={'https://www.sasworkshops.com/'} py={2}>
      <Box
        display='flex'
        flexDirection='row'
        alignItems='center'
        justifyContent='center'
      >
        <NextImage src={SAS_Logo} width={100} height={100} />
        <Typography variant='h5' px={2}>
          SAS Workshops
        </Typography>
      </Box>
    </Link>
  )

  const supportedBlock = (
    <div className='flex flex-col text-center m-auto'>
      <Typography variant='h5'>Supported by</Typography>
      <Box
        display='flex'
        flexDirection='column' //</Link>{{ xs: 'column-reverse', md: 'row' }}
        alignItems='center'
        justifyContent='center'
      >
        {gcentralBlock}
        {corgiBlock}
        {heartwareBlock}
        {sasBlock}
      </Box>
    </div>
  )

  return (
    <>
      {/* <Countdown event_start={eventStart} event_end={eventEnd} /> */}
      <div className='max-md:flex max-md:flex-col md:grid md:grid-cols-[1fr_2fr_1fr] md:grid-rows-1 w-full max-w-[90vw] mx-auto'>
        <div className='contents-display md:grid md:col-start-2 my-auto'>
          {mainBlock}
        </div>
        <div className='md:grid md:col-start-1 md:row-start-1 m-auto max-md:pb-4'>
          {NI_Block}
        </div>
        <div className='md:grid md:col-start-3'>{supportedBlock}</div>
      </div>
    </>
  )
}

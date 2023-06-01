import NI_Logo from '@/media/NI-Logo.png'
import GCentral_Logo from '@/media/GCentral-logo-color.svg'
import { Box, Link, Typography } from '@mui/material'
import NextImage from 'next/image'

export const SponsorBar: React.FC<React.PropsWithChildren<unknown>> = () => {
  return (
    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
      <Link href='https://www.ni.com' py={2}>
        <Box
          display='flex'
          flexDirection={{ xs: 'column-reverse', md: 'row' }}
          alignItems='center'
          justifyContent='center'
          width='fit-content'
        >
          <NextImage src={NI_Logo} width={180} height={180} alt='NI Logo' />
          <Typography variant='h5' sx={{ fontSize: { md: '2.5rem' } }} px={2}>
            Sponsored by NI
          </Typography>
        </Box>
      </Link>
      <Link href='https://www.gcentral.org/' py={2}>
        <Box
          display='flex'
          flexDirection={{ xs: 'column-reverse', md: 'row' }}
          alignItems='center'
          justifyContent='center'
          width='fit-content'
        >
          <NextImage src={GCentral_Logo} width={120} height={120}  alt="GCentral Logo"/>
          <Typography variant='h5' px={2}>
            Supported by GCentral
          </Typography>
        </Box>
      </Link>
    </Box>
  )
}

import NI_Logo from '@/media/NI-Logo.png'
import { Box, Link, Typography } from '@mui/material'
import NextImage from 'next/image'

export const SponsorBar: React.FC<React.PropsWithChildren<unknown>> = () => {
  return (
    <Box display='flex' justifyContent='center'>
      <Link href='https://www.ni.com'>
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
    </Box>
  )
}

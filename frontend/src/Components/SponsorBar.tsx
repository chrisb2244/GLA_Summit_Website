import NI_Logo from '@/media/NI-Logo.png'
import { Box, Typography } from '@mui/material'
import NextImage from 'next/image'

export const SponsorBar: React.FC = () => {
  return (
    <Box display='flex' flexDirection={{xs: 'column-reverse', md: 'row'}} alignItems='center' justifyContent='center'>
      <NextImage src={NI_Logo} width='180px' height='180px'/>
      <Typography variant='h5' sx={{fontSize: {md: '2.5rem'}}} px={2}>Sponsored by NI</Typography>
    </Box>
  )
}

import NextLink from 'next/link'
import NextImage from 'next/image'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { MenuBar } from './MenuBar'
import { User } from './User/User'
import GLA_Logo from '@/media/GLA-logo.svg'
import GLA_Logo_Mobile from '@/media/GLA-logo-mobile.svg'

export const Header: React.FC = () => {
  const imageProps = {
    'aria-label': 'logo'
  }
  const logo = (
    <Box gridColumn={{ xs: '1/-1', md: '1' }} height='100%' >
      <NextLink href='/'>
        <a>
          <Box display={{ xs: 'none', md: 'flex' }} pt={2} pb={1} justifyContent='center' height='100%'>
            <NextImage
              src={GLA_Logo}
              {...imageProps}
              height='100%'
              style={{ pointerEvents: 'none' }}
            />
          </Box>
          <Box display={{ xs: 'flex', md: 'none' }}>
            <NextImage
              src={GLA_Logo_Mobile}
              {...imageProps}
              style={{ pointerEvents: 'none' }}
            />
          </Box>
        </a>
      </NextLink>
    </Box>
  )

  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
  return (
    <>
      <AppBar position='static' sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar
          id='logo bar'
          disableGutters
          sx={{
            justifyContent: { xs: 'center', md: undefined },
            gridTemplateColumns: '1fr 5fr 1fr',
            gridTemplateRows: '1fr',
            display: 'grid'
          }}
        >
          {logo}
          <Box
            mx='auto'
            display={{ xs: 'none', md: 'flex' }}
            flexDirection='column'
            textAlign='center'
            gridColumn={2}
          >
            <Typography variant='h1'>GLA Summit</Typography>
            <Typography variant='h4'>14-15 November, 12:00 UTC</Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        position='sticky'
        top='0'
        left='0'
        sx={{ backgroundColor: 'primary.main', color: 'white' }}
        zIndex={100}
        mb={2}
      >
        <Toolbar disableGutters id='menu bar' sx={{ width: '100%' }}>
          <MenuBar flexGrow='1' />
          <User flexGrow='0' pr={1} />
        </Toolbar>
      </Box>
    </>
  )
}

import NextLink from 'next/link'
import NextImage from 'next/image'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { MenuBar } from './MenuBar'
import { User } from './User/User'
import GLA_Logo from '@/media/GLA-logo.svg'
import GLA_Logo_Mobile from '@/media/GLA-logo-mobile.svg'
// import MenuIcon from '@mui/icons-material/Menu'

export const Header: React.FC = () => {
  const imageProps = {
    'aria-label': 'logo'
  }
  const logo = (
    <NextLink href='/'>
      <a>
        <Box flexGrow={0} display={{ xs: 'none', md: 'flex' }}>
          <NextImage
            src={GLA_Logo}
            {...imageProps}
            height={80}
            style={{ pointerEvents: 'none' }}
          />
        </Box>
        <Box
          display={{ xs: 'flex', md: 'none' }}
          sx={{ backgroundColor: 'lightgrey' }}
        >
          <NextImage
            src={GLA_Logo_Mobile}
            {...imageProps}
            style={{ pointerEvents: 'none' }}
          />
        </Box>
      </a>
    </NextLink>
  )

  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
  return (
    <AppBar position='static' sx={{ marginBottom: '20px' }}>
      <Toolbar id='logo bar' disableGutters>
        {logo}
        <Typography
          variant='h1'
          textAlign='center'
          display={{ xs: 'none', md: 'inherit' }}
        >
          GLA Summit
        </Typography>
      </Toolbar>
      <Toolbar disableGutters id='menu bar'>
        <MenuBar flexGrow='1' />
        <User flexGrow='0' pr={1} />
      </Toolbar>
    </AppBar>
  )

  // return (
  //   <AppBar className="App-header" position="static">
  //     <Toolbar sx={classes.toolbar}>
  //       <object
  //         data="media/GLA-logo.svg"
  //         className="app-logo"
  //         height="100"
  //         aria-label="logo"
  //         style={{ pointerEvents: 'none' }}
  //       />
  //       <Typography variant="h3" sx={classes.title}>
  //         GLA Summit 2021
  //       </Typography>
  //       <MenuBar />
  //       <User />
  //     </Toolbar>
  //   </AppBar>
  // )
}

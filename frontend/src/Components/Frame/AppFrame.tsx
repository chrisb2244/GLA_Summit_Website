import { AppBar, Box, Grid, Toolbar, Typography } from '@mui/material'
import NextLink from 'next/link'
// import MenuIcon from '@mui/icons-material/Menu'
import { Countdown } from '../Countdown'
import { Footer } from '../Footer'
import { MenuBar } from '../MenuBar'

export const AppFrame: React.FC = (props) => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2022, 10, 16, 12, 0, 0))

  return (
    <Box flexDirection='column' display='flex' minHeight='100vh'>
      <AppBar position='static' sx={{ marginBottom: '20px' }}>
        <Toolbar>
          <Grid container justifyContent='center' alignItems='center'>
            <Grid item>
              <NextLink href='/'>
                <a>
                  <Box flexGrow={0}>
                    <object data='media/GLA-logo.svg' className='app-logo' height='100' aria-label='logo' style={{ pointerEvents: 'none' }} />
                  </Box>
                </a>
              </NextLink>
            </Grid>
            <Grid item flexGrow={1}>
              <Typography variant='h1' textAlign='center'>
                GLA Summit
              </Typography>
            </Grid>
            <Grid item alignItems='center'>
              <Box flexDirection='column'>
                <Box>
                  <MenuBar />
                  {/* <Typography variant='h6' textAlign='center'>Menu goes here...</Typography> */}
                </Box>
                <Countdown event_start={eventStart} event_end={eventEnd} />
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: '1 0 auto' , '> *': {maxWidth: '80%', mx: 'auto'}}}>
        {props.children}
      </Box>

      <Footer />
    </Box>
  )
}

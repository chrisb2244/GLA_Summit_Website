import { AppBar, Box, Link, Grid, Toolbar, Typography } from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'
import { Countdown } from '../Countdown'

export const AppFrame: React.FC = (props) => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2021, 10, 15, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2021, 10, 16, 12, 0, 0))

  return (
    <Box flexDirection='column'>
      <AppBar position='static' sx={{ marginBottom: '20px' }}>
        <Toolbar>
          <Grid container justifyContent='center' alignItems='center'>
            <Grid item>
              <Link href='/'>
                <Box flexGrow={0}>
                  <object data='media/GLA-logo.svg' height='100' aria-label='logo' />
                </Box>
              </Link>
            </Grid>
            <Grid item flexGrow={1}>
              <Typography variant='h1' textAlign='center'>
                GLA Summit
              </Typography>
            </Grid>
            <Grid item alignItems='center'>
              <Box flexDirection='column'>
                <Countdown event_start={eventStart} event_end={eventEnd} />
                <Box>
                  <Typography variant='h6' textAlign='center'>Menu goes here...</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      <Box>
        {props.children}
      </Box>
    </Box>
  )
}

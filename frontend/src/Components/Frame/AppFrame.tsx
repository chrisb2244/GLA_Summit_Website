import { AppBar, Box, Link, Toolbar, Typography } from '@material-ui/core'
// import MenuIcon from '@material-ui/icons/Menu'
import { Countdown } from '../Countdown'

export const AppFrame: React.FC = (props) => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2021, 10, 15, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2021, 10, 16, 12, 0, 0))

  return (
    <Box flexDirection='column'>
      <AppBar position='static' sx={{marginBottom: "20px"}}>
        <Toolbar>
          <Link href='/'>
            <Box flexGrow={0}>
              <object data='media/GLA-logo.svg' height='100' aria-label='logo' />
            </Box>
          </Link>
          <Typography variant='h1' flexGrow={1} textAlign='center'>
            GLA Summit
          </Typography>
          <Box flexDirection="column">
            <Countdown event_start={eventStart} event_end={eventEnd} />
            <Box>
              <Typography variant="h6">Menu goes here...</Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box>
        {props.children}
      </Box>
    </Box>
  )
}

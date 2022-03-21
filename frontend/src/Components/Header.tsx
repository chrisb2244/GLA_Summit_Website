import NextLink from 'next/link'
import { AppBar, Toolbar, Typography, Grid, Box } from '@mui/material'
import { MenuBar } from './MenuBar'
import { User } from './User/User'
import { Countdown } from './Countdown'
// import MenuIcon from '@mui/icons-material/Menu'

// const useStyles = makeStyles((theme: Theme) =>
//   createStyles({

// const classes = {
//   root: {
//     flexGrow: 1
//   },
//   title: {
//     flexGrow: 1
//   },
//   menuContainer: {
//     // marginLeft: theme.spacing(2),
//     flexGrow: 0
//   },
//   appLogo: {
//     flexGrow: 0
//     // marginRight: theme.spacing(5)
//   },
//   toolbar: {
//     width: '70%'
//   }
// }

export const Header: React.FC = (props) => {
  // The month value is 0-based (so 10 -> November)
  const eventStart = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  const eventEnd = new Date(Date.UTC(2022, 10, 16, 12, 0, 0))

  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...

  return (
    <AppBar position='static' sx={{ marginBottom: '20px' }}>
      <Toolbar>
        <Grid container justifyContent='center' alignItems='center'>
          <Grid item>
            <NextLink href='/'>
              <a>
                <Box flexGrow={0}>
                  <object
                    data='media/GLA-logo.svg'
                    className='app-logo'
                    height='100'
                    aria-label='logo'
                    style={{ pointerEvents: 'none' }}
                  />
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
              </Box>
              <Countdown event_start={eventStart} event_end={eventEnd} />
            </Box>
          </Grid>
          <User />
        </Grid>
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

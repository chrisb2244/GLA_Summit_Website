import { MenuBar } from './MenuBar'
import { User } from './User'
import { AppBar, Toolbar, Typography } from '@mui/material'

// const useStyles = makeStyles((theme: Theme) =>
//   createStyles({

const classes = {
  root: {
    flexGrow: 1
  },
  title: {
    flexGrow: 1
  },
  menuContainer: {
    // marginLeft: theme.spacing(2),
    flexGrow: 0
  },
  appLogo: {
    flexGrow: 0
    // marginRight: theme.spacing(5)
  },
  toolbar: {
    width: '70%'
  }
}

export const Header: React.FC = (props) => {
  // const classes = useStyles()

  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...

  return (
    <AppBar className='App-header' position='static'>
      <Toolbar sx={classes.toolbar}>
        <object data='media/GLA-logo.svg' className='app-logo' height='100' aria-label='logo' style={{ pointerEvents: 'none' }} />
        <Typography variant='h3' sx={classes.title}>
          GLA Summit 2021
        </Typography>
        <MenuBar />
        <User />
      </Toolbar>
    </AppBar>
  )
}

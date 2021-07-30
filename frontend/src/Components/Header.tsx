import logo from '../GLA-logo.svg'
import { MenuBar } from './MenuBar'
import { AppBar, createStyles, makeStyles, Theme, Toolbar, Typography } from '@material-ui/core'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    title: {
      flexGrow: 1
    },
    menuContainer: {
      marginLeft: theme.spacing(2),
      flexGrow: 0
    },
    appLogo: {
      flexGrow: 0,
      marginRight: theme.spacing(5)
    },
    toolbar: {
      width: '70%'
    }
  })
)

export const Header: React.FC = (props) => {
  const classes = useStyles()

  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...

  return (
    <AppBar className='App-header' position='static'>
      <Toolbar className={classes.toolbar}>
        <img src={logo} className={`App-logo ${classes.appLogo}`} alt='logo' />
        <Typography variant='h3' className={classes.title}>
          GLA Summit 2021
        </Typography>
        <MenuBar narrowWidth />
      </Toolbar>
    </AppBar>
  )
}

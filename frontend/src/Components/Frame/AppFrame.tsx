import { AppBar, Box, Button, Link, Toolbar, Typography } from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'

export const AppFrame: React.FC = (props) => {
  return (
    <div>
      <AppBar position='fixed'>
        <Toolbar sx={{ display: 'flex' }}>
          <Link href='/'>
            <Box flexGrow={0}>
              <object data='media/GLA-logo.svg' height='100' aria-label='logo' />
            </Box>
          </Link>
          <Typography variant='h1' flexGrow={1}>
            GLA Summit
          </Typography>
        </Toolbar>
      </AppBar>
      {props.children}
    </div>
  )
}

import { Box, Toolbar, Typography, Link } from '@mui/material'
import { SocialMediaIcons } from './SocialMediaIcons'

export const Footer: React.FC = (props) => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...

  return (
    <footer className='App-footer'>
      <Toolbar sx={{justifyContent: 'space-between', color: (t) => t.palette.primary.contrastText, bgcolor: (theme) => theme.palette.primary.main}}>
        {/* <object data='media/GLA-logo.svg' className='app-logo' height='100' aria-label='logo' style={{ pointerEvents: 'none' }} /> */}
        <SocialMediaIcons />
        <Box display='flex' flexDirection='column'>
          <Typography variant='body2' fontSize='small'>
            {'\u00A9 2022 GLA Organizers'}
          </Typography>
          <Typography variant='body2' fontSize='small'>
            Contact Us:&nbsp;
            <Link href='mailto:contact@glasummit.org' color='#fff'>
              contact@glasummit.org
            </Link>
          </Typography>
        </Box>
      </Toolbar>
    </footer>
  )
}

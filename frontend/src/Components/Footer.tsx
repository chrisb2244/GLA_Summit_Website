import { Toolbar, Typography } from '@mui/material'
import { SocialMediaIcons } from './SocialMediaIcons'

export const Footer: React.FC = (props) => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...

  return (
    <footer className='App-footer'>
      <Toolbar sx={{justifyContent: 'space-between'}}>
        <object data='media/GLA-logo.svg' className='app-logo' height='100' aria-label='logo' style={{ pointerEvents: 'none' }} />
        <SocialMediaIcons />
        <Typography variant='body2'>
          {`\u00A9 2022 GLA Organizers`}
        </Typography>
      </Toolbar>
    </footer>
  )
}

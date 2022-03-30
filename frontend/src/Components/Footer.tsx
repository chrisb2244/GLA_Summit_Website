import { Box, Toolbar, Typography, Link } from '@mui/material'
import { SocialMediaIcons } from './SocialMediaIcons'

export const Footer: React.FC = () => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
  const FileLink = (props: { link: string, title: string }): JSX.Element => {
    const text = (
      <Typography
        variant='body2'
        fontSize='small'
        sx={{ px: { xs: 0, md: 2 } }}
      >
        {props.title}
      </Typography>
    )

    if (props.link !== '') {
      return (
        <Link href={props.link} color='#fff'>
          {text}
        </Link>
      )
    } else {
      return text
    }
  }

  return (
    <footer className='App-footer'>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          color: (t) => t.palette.primary.contrastText,
          bgcolor: (theme) => theme.palette.primary.main,
          alignItems: 'center'
        }}
      >
        <SocialMediaIcons />
        <Box display='flex' flexDirection={{ xs: 'column', md: 'row' }}>
          <FileLink title='Code of Conduct' link='media/codeofconduct.pdf' />
          <FileLink title='Privacy Policy' link='' />
        </Box>
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

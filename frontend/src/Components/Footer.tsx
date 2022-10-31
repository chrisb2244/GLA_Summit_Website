import { Box, Toolbar, Typography, Link } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { SocialMediaIcons } from './SocialMediaIcons'

export const Footer: React.FC<React.PropsWithChildren<unknown>> = () => {
  // The 'Toolbar' component appears to make the flow
  // direction a row, rather than a column otherwise...
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
        <Box
          display='flex'
          flexDirection={{ xs: 'column', md: 'row' }}
          flexGrow='1'
          justifyContent='space-between'
          marginX='auto'
          py={{ xs: 2, md: 0 }}
        >
          <SocialMediaIcons />
          <FileLink title='Code of Conduct' link='media/codeofconduct.pdf' />
          <FileLink title='Privacy Policy' link='media/privacypolicy.pdf' />
          <Box display='flex' flexDirection='column' alignItems='center'>
            <SmallFont>
              Contact Us:&nbsp;
              <Link href='mailto:contact@glasummit.org' color='#fff'>
                contact@glasummit.org
              </Link>
            </SmallFont>
            <SmallFont>{'\u00A9 2022 GLA Organizers'}</SmallFont>
          </Box>
        </Box>
      </Toolbar>
    </footer>
  )
}

const SmallFont: React.FC<React.PropsWithChildren<TypographyProps>> = ({ children, ...otherProps }) => {
  return (
    <Typography variant='body2' fontSize='small' {...otherProps}>
      {children}
    </Typography>
  )
}

const FileLink = (props: { link: string; title: string }): JSX.Element => {
  const text = (
    <SmallFont sx={{ py: { xs: 0.1, md: 0 } }} alignSelf='center'>
      {props.title}
    </SmallFont>
  )

  if (props.link !== '') {
    return (
      <Link href={props.link} color='#fff' alignSelf='center'>
        {text}
      </Link>
    )
  } else {
    return text
  }
}

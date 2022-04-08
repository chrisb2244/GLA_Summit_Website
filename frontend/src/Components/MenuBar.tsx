import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import { Typography, Button, Box } from '@mui/material'

export const MenuBar: React.FC<{ narrowWidth?: boolean }> = (props) => {
  if (props.narrowWidth ?? false) {
    return <MenuIcon />
  }

  return (
    <Box className='gla-main-menu' role='menu' sx={{ alignContent: 'center', padding: '5px' }}>
      {[
        { title: 'Home', link: '/' },
        { title: 'Our Team', link: '/our-team' },
        { title: 'Submit a Presentation', link: '/submit-presentation' },
        { title: 'Lorem', link: '/lorem-ipsum' }
      ].map(({ title, link }) => {
        return (
          <Button sx={{ color: 'white' }} key={title}>
            <Link href={link} passHref>
              <Typography variant='button' role='menuitem'>
                {title}
              </Typography>
            </Link>
          </Button>
        )
      })}
    </Box>
  )
}

import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import { Typography } from '@mui/material'

export const MenuBar: React.FC<{ narrowWidth?: boolean }> = (props) => {
  if (props.narrowWidth ?? false) {
    return <MenuIcon />
  }

  return (
    <ul className='gla-main-menu' role='menu'>
      <li>
        <Link href='/'>
          <Typography variant='button' role='menuitem'>
            Home
          </Typography>
        </Link>
      </li>
      <li>
        <Link href='/our-team'>
          <Typography variant='button' role='menuitem'>
            Our Team
          </Typography>
        </Link>
      </li>
      <li>
        <Link href='/submit-presentation'>
          <Typography variant='button' role='menuitem'>
            Submit a Presentation
          </Typography>
        </Link>
      </li>
    </ul>
  )
}

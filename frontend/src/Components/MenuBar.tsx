import { Link } from 'react-router-dom'
import MenuIcon from '@material-ui/icons/Menu'
import '../GLA-generic.css'
import { Typography } from '@material-ui/core'

export const MenuBar: React.FC<{narrowWidth?: boolean}> = (props) => {
  if (props.narrowWidth ?? false) {
    return <MenuIcon />
  }

  return (
    <>
      <ul className='gla-main-menu'>
        <li>
          <Link to='/'><Typography variant='h5'>Home</Typography></Link>
        </li>
        <li>
          <Link to='/our-team'><Typography variant='h5'>Our Team</Typography></Link>
        </li>
        <li>
          <Link to='/submit-presentation'><Typography variant='button' color='white'>Submit a Presentation</Typography></Link>
        </li>
      </ul>
    </>
  )
}

import { Link } from 'react-router-dom'
import MenuIcon from '@material-ui/icons/Menu'
import '../GLA-generic.css'

export const MenuBar: React.FC<{narrowWidth?: boolean}> = (props) => {
  if (props.narrowWidth ?? false) {
    return <MenuIcon />
  }

  return (
    <>
      <ul className='gla-main-menu'>
        <li>
          <Link to='/'>Home</Link>
        </li>
        <li>
          <Link to='/our-team'>Our Team</Link>
        </li>
        <li>
          <Link to='/submit-presentation'>Submit a Presentation</Link>
        </li>
      </ul>
    </>
  )
}

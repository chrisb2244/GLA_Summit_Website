import { Link } from 'react-router-dom';
import { Menu } from '@material-ui/icons';
import "../GLA-generic.css"

export function MenuBar(props: {narrowWidth?: boolean}) {
  if (props.narrowWidth) {
    return <Menu />
  }

  return (
    <>
        <ul className="gla-main-menu">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/our-team">Our Team</Link>
          </li>
          <li>
            <Link to="/submit-presentation">Submit a Presentation</Link>
          </li>
        </ul>
    </>
  )
}

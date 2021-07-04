import { Link, BrowserRouter as Router } from 'react-router-dom';
import "../GLA-generic.css"

export function MenuBar(props: {}) {


  return (
    <>
      <Router>
        <ul className="gla-main-menu">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/our-team">Our Team</Link>
          </li>
        </ul>
      </Router>
    </>
  )
}

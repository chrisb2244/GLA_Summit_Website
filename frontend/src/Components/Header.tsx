import logo from '../GLA-logo.svg';
import { MenuBar } from './MenuBar';

export function Header(props: {}) {
  return (
    <>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>
          GLA Summit 2021
        </h1>
        <MenuBar/>
      </header>
    </>
  )
}
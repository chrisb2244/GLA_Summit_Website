import { Header } from './Components/Header';
import { Countdown } from './Components/Countdown';
import { OurTeam } from './Components/OurTeam';
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { SubmitPresentationForm } from './Components/SubmitPresentationForm';
import { ThemeProvider } from '@material-ui/styles';
import { CssBaseline } from '@material-ui/core';
import { theme } from './theme'
import './App.css';
import './GLA-generic.css'
import { HomePage } from './Components/HomePage';

function App() {
  const eventStart = new Date(2021, 10, 15);
  eventStart.setUTCHours(12, 0, 0);
  const eventEnd = new Date(eventStart.getTime() + (24 * 3600000));
  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Header />
          <Countdown event_start={eventStart} event_end={eventEnd} />
          <Switch>
            <Route path="/our-team">
              <OurTeam />
            </Route>
            <Route path="/submit-presentation">
              <SubmitPresentationForm />
            </Route>
            <Route path="/" exact>
              <HomePage />
            </Route>
          </Switch>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;

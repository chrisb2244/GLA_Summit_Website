import { Header } from './Components/Header';
import { Countdown } from './Components/Countdown';
import { OurTeam } from './Components/OurTeam';
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import './App.css';

function App() {
  const eventStart = new Date(2021, 10, 15);
  eventStart.setUTCHours(12, 0, 0);
  const eventEnd = new Date(eventStart.getTime() + (24*3600000));
  return (
    <div className="App">
      <Router>
        <Header/>
        <Countdown event_start={eventStart} event_end={eventEnd}/>
        <Switch>
          <Route path="/our-team">
            <OurTeam/>
          </Route>
          <Route path="/" exact>
            <div>
              <p>This is the homepage text...</p>
            </div>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;

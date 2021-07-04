import { Header } from './Components/Header';
import { Countdown } from './Components/Countdown';
import './App.css';

function App() {
  const eventStart = new Date(2021, 10, 15);
  eventStart.setUTCHours(12, 0, 0);
  const eventEnd = new Date(eventStart.getTime() + (24*3600000));
  return (
    <div className="App">
      <Header/>
      <Countdown event_start={eventStart} event_end={eventEnd}/>
    </div>
  );
}

export default App;

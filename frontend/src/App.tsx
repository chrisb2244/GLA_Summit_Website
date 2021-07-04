import { Header } from './Components/Header';
import { Countdown } from './Components/Countdown';
import './App.css';

function App() {
  const eventTime = new Date(2021, 10, 15);
  eventTime.setUTCHours(12, 0, 0);
  return (
    <div className="App">
      <Header/>
      <Countdown target={eventTime}/>
    </div>
  );
}

export default App;

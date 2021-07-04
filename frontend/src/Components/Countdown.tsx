import { useEffect, useState } from "react";

export type CountdownProps = {
  event_start: Date
  event_end: Date
}

type TimerValues = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type EventStatus = "Upcoming" | "Live" | "Finished";

export function Countdown(props: CountdownProps) {
  function zeroTimerVals() {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const [timerVals, setTimerVals] = useState<TimerValues>(zeroTimerVals());
  const [status, setStatus] = useState<EventStatus>();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      let distance = (props.event_start.getTime() - now);
      if (distance > 0) {
        // Event hasn't started yet
        const tVals = calcTimeValues(distance);
        setTimerVals(tVals);
        setStatus("Upcoming");
      } else {
        distance = (props.event_end.getTime() - now);
        if (distance > 0) {
          // Event is ongoing
          const tVals = calcTimeValues(distance);
          setTimerVals(tVals);
          setStatus("Live");
        } else {
          // Event has finished
          setTimerVals(zeroTimerVals())  
          setStatus("Finished")
        }
      }
    }, 1000);
    return () => {
      clearInterval(interval)
    };
  }, [props.event_start, props.event_end, setTimerVals]);

  function calcTimeValues(distanceInMilliseconds: number): TimerValues {
    let remaining = distanceInMilliseconds / 1000;
    const days = Math.floor(remaining / (3600 * 24));
    remaining -= (days * 3600 * 24);
    const hours = Math.floor(remaining / 3600);
    remaining -= (hours * 3600)
    const minutes = Math.floor(remaining / 60);
    remaining -= (minutes * 60)
    const seconds = Math.floor(remaining);
    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    };
  }

  let display = <></>
  switch(status) {
    case "Upcoming":
      display = (
        <div>
          <span>Event will start in: </span>
          <span>{timerVals.days} days, </span>
          <span>{timerVals.hours} hours, </span>
          <span>{timerVals.minutes} minutes, </span>
          <span>{timerVals.seconds} seconds.</span>
        </div>
      )
      break;
    case "Live":
      display = (
        <div>
          <span>Event is live for the next: </span>
          <span>{timerVals.days} days, </span>
          <span>{timerVals.hours} hours, </span>
          <span>{timerVals.minutes} minutes, </span>
          <span>{timerVals.seconds} seconds.</span>
        </div>
      )
      break;
    case "Finished":
      display = (
        <div>
          <span>This event has finished.</span>
        </div>
      )
  }
  return display;
}

import { useEffect, useState } from 'react'

export interface CountdownProps {
  event_start: Date
  event_end: Date
}

type TimerValues = {
  days: number
  hours: number
  minutes: number
  seconds: number
}
const zeroTimerVals: TimerValues = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
}

type EventStatus = 'Upcoming' | 'Live' | 'Finished'

export const Countdown: React.FC<React.PropsWithChildren<CountdownProps>> = (props) => {
  const [timerVals, setTimerVals] = useState<TimerValues>(zeroTimerVals)
  const [status, setStatus] = useState<EventStatus>()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      let distance = props.event_start.getTime() - now
      if (distance > 0) {
        // Event hasn't started yet
        const tVals = calcTimeValues(distance)
        setTimerVals(tVals)
        setStatus('Upcoming')
      } else {
        distance = props.event_end.getTime() - now
        if (distance > 0) {
          // Event is ongoing
          const tVals = calcTimeValues(distance)
          setTimerVals(tVals)
          setStatus('Live')
        } else {
          // Event has finished
          setTimerVals(zeroTimerVals)
          setStatus('Finished')
        }
      }
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [props.event_start, props.event_end, setTimerVals])

  const displayProps = {
    width: 300,
    height: 74
  }

  return (
    <div className={`mb-4 py-2 items-center flex flex-col bg-primaryc.light rounded-[12.5%/50%] w-[300px] mx-auto px-4`}>
      <div>
        {status === 'Upcoming'
          ? 'This event will start in:'
          : status === 'Live'
          ? 'This event is live for the next:'
          : null}
      </div>
      <div className='flex flex-row' title='countdown'>
        {typeof status === 'undefined' ? (
          <div style={{ ...displayProps }} />
        ) : status !== 'Finished' ? (
          <>
            <CounterElem unit='Days'>{timerVals.days}</CounterElem>
            <CounterElem unit='Hours'>{timerVals.hours}</CounterElem>
            <CounterElem unit='Minutes'>{timerVals.minutes}</CounterElem>
            <CounterElem unit='Seconds'>{timerVals.seconds}</CounterElem>
          </>
        ) : (
          <div>This event has finished.</div>
        )}
      </div>
    </div>
  )
}

type CounterElemUnit = 'Days' | 'Hours' | 'Minutes' | 'Seconds'

const CounterElem: React.FC<React.PropsWithChildren<{unit: CounterElemUnit}>> = (props) => {
  return (
    <div className='inline-block px-3 text-center'>
      <div className='text-2xl'>
        {props.children}
      </div>
      <div className='text-sm'>
        {props.unit}
      </div>
    </div>
  )
}

function calcTimeValues(distanceInMilliseconds: number): TimerValues {
  let remaining = distanceInMilliseconds / 1000
  const days = Math.floor(remaining / (3600 * 24))
  remaining -= days * 3600 * 24
  const hours = Math.floor(remaining / 3600)
  remaining -= hours * 3600
  const minutes = Math.floor(remaining / 60)
  remaining -= minutes * 60
  const seconds = Math.floor(remaining)
  return {
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds
  }
}

import { useEffect, useState } from 'react'
import { Box, Container, Grid, Typography } from '@material-ui/core'
// import '../GLA-generic.css'

export interface CountdownProps {
  event_start: Date
  event_end: Date
}

interface TimerValues {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type EventStatus = 'Upcoming' | 'Live' | 'Finished'

export const Countdown: React.FC<CountdownProps> = (props) => {
  function zeroTimerVals (): TimerValues {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  const [timerVals, setTimerVals] = useState<TimerValues>(zeroTimerVals())
  const [status, setStatus] = useState<EventStatus>()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      let distance = (props.event_start.getTime() - now)
      if (distance > 0) {
        // Event hasn't started yet
        const tVals = calcTimeValues(distance)
        setTimerVals(tVals)
        setStatus('Upcoming')
      } else {
        distance = (props.event_end.getTime() - now)
        if (distance > 0) {
          // Event is ongoing
          const tVals = calcTimeValues(distance)
          setTimerVals(tVals)
          setStatus('Live')
        } else {
          // Event has finished
          setTimerVals(zeroTimerVals())
          setStatus('Finished')
        }
      }
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [props.event_start, props.event_end, setTimerVals])

  function calcTimeValues (distanceInMilliseconds: number): TimerValues {
    let remaining = distanceInMilliseconds / 1000
    const days = Math.floor(remaining / (3600 * 24))
    remaining -= (days * 3600 * 24)
    const hours = Math.floor(remaining / 3600)
    remaining -= (hours * 3600)
    const minutes = Math.floor(remaining / 60)
    remaining -= (minutes * 60)
    const seconds = Math.floor(remaining)
    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    }
  }

  const counterElems = status !== 'Finished' ? (
    <>
      <CounterText className='gla-countdown-text'>{status === 'Upcoming' ? 'This event will start in:' : 'This event is live for the next:'}</CounterText>
      {/* <div><span className='days'>{timerVals.days}</span><div className='smallText'>Days</div></div>
      <div><span className='hours'>{timerVals.hours}</span><div className='smallText'>Hours</div></div>
      <div><span className='minutes'>{timerVals.minutes}</span><div className='smallText'>Minutes</div></div>
      <div><span className='seconds'>{timerVals.seconds}</span><div className='smallText'>Seconds</div></div> */}
      <Box flexDirection='row' flexGrow={1}>
        <CounterElem unit='days'>{timerVals.days}</CounterElem>
        <CounterElem unit='hours'>{timerVals.hours}</CounterElem>
        <CounterElem unit='minutes'>{timerVals.minutes}</CounterElem>
        <CounterElem unit='seconds'>{timerVals.seconds}</CounterElem>
      </Box>
    </>
  ) : <CounterText>This event has finished.</CounterText>

  return (
    <Box  className='gla-countdown-container' sx={{backgroundColor: 'black', borderRadius: '12.5%/50%'}}>
    <Container>
      {counterElems}
    </Container>
    </Box>
  )
}

const CounterElem: React.FC<{ unit: 'days' | 'hours' | 'minutes' | 'seconds' }> = (props) => {
  return (
    <Box sx={{ display: 'inline-block', paddingInline: '10px', textAlign: 'center' }}>
      <Typography variant="body1" component='div' className={props.unit}>{props.children}</Typography>
      <Typography variant="body2" component='div' className='smallText'>{props.unit.toLocaleUpperCase()}</Typography>
    </Box>
  )
}

const CounterText: React.FC<{ className?: string }> = (props) => {
  return <Typography variant="body1" component='div' className={props.className} textAlign='center'>{props.children}</Typography>
}
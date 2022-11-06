import { useEffect, useState } from 'react'
import { Box, Container, Typography } from '@mui/material'

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

export const Countdown: React.FC<CountdownProps> = (props) => {
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
    <Container
      sx={{
        mb: 2,
        py: 1,
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'primary.light',
        borderRadius: '12.5%/50%',
        width: displayProps.width
      }}
    >
      <Typography variant='body1'>
        {status === 'Upcoming'
          ? 'This event will start in:'
          : status === 'Live'
          ? 'This event is live for the next:'
          : null}
      </Typography>
      <Box title='countdown' sx={{ display: 'flex', flexDirection: 'row' }}>
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
          <Typography variant='body1'>This event has finished.</Typography>
        )}
      </Box>
    </Container>
  )
}

const CounterElem: React.FC<{
  unit: 'Days' | 'Hours' | 'Minutes' | 'Seconds',
  children?: React.ReactNode
}> = (props) => {
  return (
    <Box
      sx={{
        display: 'inline-block',
        paddingInline: '10px',
        textAlign: 'center'
      }}
    >
      <Typography variant='body2' component='div' fontSize='larger'>
        {props.children}
      </Typography>
      <Typography variant='body2' component='div' fontSize='small'>
        {props.unit}
      </Typography>
    </Box>
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

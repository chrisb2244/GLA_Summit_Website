export type TimeMarkerProps = {
  startDate: Date
  durationInHours?: number
  currentTime: Date
  height: number
  extentInHours: number
  offsetFraction: number
  stringFormatter: (d: Date) => string
}

export const TimeMarkers = (props: TimeMarkerProps) => {
  const duration = props.durationInHours
    ? Math.round(props.durationInHours)
    : 24
  const visibleExtent = props.extentInHours * 60 * 60 * 1000

  const timeMarkers = new Array(duration + 1)
    .fill(0)
    .map((v, idx) => {
      const tOffset = idx * 60 * 60 * 1000
      return new Date(props.startDate.getTime() + tOffset)
    })
    .map((t) => {
      const timeUntil = t.getTime() - props.currentTime.getTime()
      if (timeUntil < -(visibleExtent / props.offsetFraction)) {
        return null
      }
      const relStart = timeUntil / visibleExtent + props.offsetFraction
      return {
        time: t,
        timeString: props.stringFormatter(t),
        position: relStart * props.height
      }
    })
    .map((tMark) => {
      if (tMark === null) {
        return null
      }
      return (
        <span
          style={{
            position: 'absolute',
            display: 'inline',
            top: `calc(${tMark?.position}px - 0.75em)`,
            left: '0.5ch'
          }}
          key={tMark.time.getTime()}
        >
          {tMark.timeString}
        </span>
      )
    })
    .filter((t) => t !== null)

  return <>{timeMarkers}</>
}

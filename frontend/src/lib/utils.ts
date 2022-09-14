const shouldLog = process.env.NODE_ENV !== 'production'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const myLog = (v: any) => {
  if (shouldLog) {
    console.log(v)
  }
}

// Timezone info - default to client local, allow storing preference in profile
export type TimezoneInfo = {
  timeZone: string
  timeZoneName: string
  use24HourClock: boolean
}

export const defaultTimezoneInfo = () => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
  const timeZoneString = new Date().toLocaleDateString(undefined, { timeZoneName: 'long' })
  const timeZoneNameBlock = timeZoneString.split(',')[1]
  let timeZoneName = ''
  if(timeZoneNameBlock != null) {
    timeZoneName = timeZoneNameBlock.trim()
  } else {
    const fallbackBlock = timeZoneString.split(' ')[1]
    if (fallbackBlock != null) {
      timeZoneName = fallbackBlock.trim()
    } else {
      timeZoneName = ''
      console.warn("Unable to detect timezone name from " + timeZoneString)
    }
  }
  return { timeZone, timeZoneName, use24HourClock: false }
}
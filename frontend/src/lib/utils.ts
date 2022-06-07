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
  const timeZoneName = new Date()
    .toLocaleDateString(undefined, { timeZoneName: 'long' })
    .split(',')[1]
    .trim()
  return { timeZone, timeZoneName, use24HourClock: false }
}
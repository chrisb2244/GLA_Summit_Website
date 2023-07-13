import { Presentation } from '@/Components/PresentationSummary'
import { PresentationType } from './databaseModels'
import { createAdminClient } from './supabaseClient'

const shouldLog = process.env.NODE_ENV !== 'production'
const dbLog = true // process.env.NODE_ENV === 'production'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const myLog = (v: any) => {
  if (shouldLog) {
    console.log(v)
  }
}

export const logErrorToDb = async (
  v: { message: string } | string,
  severity: 'info' | 'error' | 'severe',
  currentUserId?: string
) => {
  if (dbLog) {
    const client = createAdminClient()
    const { error } = await client.from('log').insert({
      severity,
      message: typeof v === 'string' ? v : v.message,
      user_id: currentUserId
    })
    if (error) {
      console.log(error)
      // client.from('log').insert({
      //   s
      // }
    }
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
  const timeZoneString = new Date().toLocaleDateString(undefined, {
    timeZoneName: 'long'
  })
  const timeZoneNameBlock = timeZoneString.split(',')[1]
  let timeZoneName = ''
  if (timeZoneNameBlock != null) {
    timeZoneName = timeZoneNameBlock.trim()
  } else {
    const fallbackBlock = timeZoneString.split(' ')[1]
    if (fallbackBlock != null) {
      timeZoneName = fallbackBlock.trim()
    } else {
      timeZoneName = ''
      console.warn('Unable to detect timezone name from ' + timeZoneString)
    }
  }
  return { timeZone, timeZoneName, use24HourClock: false }
}

export const estimateAspectRatio = (width: number, height: number) => {
  // https://gist.github.com/jonathantneal/d3a259ebeb46de7ab0de
  const ratio = (width * 100) / (height * 100)
  const maxW = 16
  const maxH = 16

  const ratiosW = new Array(maxW).join(',').split(',')
  const ratiosH = new Array(maxH).join(',').split(',')
  const ratiosT: { [key: number]: boolean } = {}
  const ratios: { [key: string]: number } = {}
  let match: string | undefined = undefined

  ratiosW.forEach((empty, ratioW) => {
    ++ratioW // value from 1 to 16
    ratiosH.forEach((empty, ratioH) => {
      ++ratioH
      const ratioX = (ratioW * 100) / (ratioH * 100)
      if (!ratiosT[ratioX]) {
        ratiosT[ratioX] = true
        ratios[ratioW + ':' + ratioH] = ratioX
      }
    })
  })

  // return '16:9'

  for (const key in ratios) {
    if (
      !match ||
      Math.abs(ratio - ratios[key]) < Math.abs(ratio - ratios[match])
    ) {
      match = key
    }
  }

  if (match === '8:5') {
    return '16:10'
  }

  return match
}

export const getSessionDurationInMinutes = (
  type: PresentationType,
  windowType: 'schedule' | 'agenda-window' = 'schedule'
) => {
  switch (type) {
    case 'full length':
      return windowType === 'agenda-window' ? 60 : 45
    case 'panel':
      return 60
    case '7x7':
      return 7
    case '15 minutes':
      return 15
    case 'quiz':
      return 30
    case 'session-container':
      return 60
  }
}

export const sortPresentationsBySchedule = (
  a: Presentation,
  b: Presentation
) => {
  // negative if a < b
  // Returns "smallest" first
  if (b.scheduledFor !== null && a.scheduledFor !== null) {
    return (
      -1 *
      (new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
    )
  } else if (b.scheduledFor !== null) {
    return 1 // b has a scheduled time, a does not. b first.
  } else if (a.scheduledFor !== null) {
    return -1 // a has a scheduled time, b does not. a first.
  } else {
    return 0
  }
}

export const sortPresentationsByPresenterName = (
  a: Presentation,
  b: Presentation
) => {
  const bPrimarySpeaker = Array.isArray(b.speakers) ? b.speakers[0] : b.speakers
  const aPrimarySpeaker = Array.isArray(a.speakers) ? a.speakers[0] : a.speakers
  return (
    -1 * ('' + bPrimarySpeaker.lastname).localeCompare(aPrimarySpeaker.lastname)
  )
}

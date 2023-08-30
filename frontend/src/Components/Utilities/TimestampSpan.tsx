'use client'

import { useCallback, useEffect, useState } from 'react'

type TimeValue = string | null | { start: string; end: string }
type DateDisplay = {
  year?: 'numeric' | '2-digit' | undefined
  month?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow' | undefined
  day?: 'numeric' | '2-digit' | undefined
}

type TimestampSpanProps = {
  utcValue: TimeValue
  displayUTC?: boolean
  use12Hour?: boolean
  dateFormat?: DateDisplay
}

export const TimestampSpan = (props: TimestampSpanProps) => {
  const { utcValue, displayUTC, use12Hour, dateFormat } = props

  const format = useCallback(
    (utcString: TimeValue, tz?: string) => {
      if (utcString === null) {
        return ''
      }
      const { year, month, day } = dateFormat || {
        year: undefined,
        month: undefined,
        day: undefined
      }
      const locale = undefined
      const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        hour12: use12Hour,
        hourCycle: 'h23',
        year,
        month,
        day,
        timeZoneName: 'short'
      })
      if (typeof utcString === 'object') {
        const { start, end } = utcString
        const ds = new Date(start)
        const de = new Date(end)
        return formatter.formatRange(ds, de)
      }
      const d = new Date(utcString)
      return formatter.format(d)
    },
    [dateFormat, use12Hour]
  )

  const utcSpan = (
    <span suppressHydrationWarning>{format(utcValue, 'UTC')}</span>
  )
  const [localTimeElem, setLocalTimeElem] = useState<JSX.Element>(utcSpan)
  useEffect(() => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
    const localElem = (
      <span suppressHydrationWarning>{format(utcValue, timeZone)}</span>
    )
    setLocalTimeElem(localElem)
  }, [format, utcValue])

  return (
    <div className='flex flex-col text-sm italic'>
      {localTimeElem}
      {displayUTC && utcSpan !== localTimeElem ? utcSpan : null}
    </div>
  )
}

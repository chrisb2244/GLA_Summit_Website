'use client'

import { NextPage } from 'next'
import { useEffect, useReducer } from 'react'
import { LogEntry, LogViewer } from '@/Components/LogViewer'
import { Database } from '@/lib/sb_databaseModels'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { myLog } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['log']['Row']
>
type SubscriptionEvent =
  | DB_SubscriptionEvent
  | {
      eventType: 'INITIALIZE'
      data: LogEntry[]
    }

const LogsPage: NextPage<{ serverLogs: LogEntry[] }> = ({ serverLogs }) => {
  const logEntryReducer = (
    cachedEntries: LogEntry[],
    payload: SubscriptionEvent
  ) => {
    switch (payload.eventType) {
      case 'INSERT':
        return cachedEntries.concat(payload.new)
      case 'DELETE':
        return cachedEntries.filter(({ id }) => id !== payload.old.id)
      case 'UPDATE':
        return cachedEntries.map((e) => {
          return e.id === payload.new.id ? payload.new : e
        })
      case 'INITIALIZE':
        return payload.data
    }
  }

  const [logEntries, updateLogEntries] = useReducer(logEntryReducer, serverLogs)

  useEffect(() => {
    myLog('adding subscription')
    const subscription = createClientComponentClient<Database>()
      .channel('public:log')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'log'
        },
        (payload: DB_SubscriptionEvent) => {
          updateLogEntries(payload)
        }
      )
      .subscribe()

    return () => {
      myLog('unsubscribing')
      subscription.unsubscribe()
    }
  }, [])

  return <LogViewer entries={logEntries} />
}

export default LogsPage

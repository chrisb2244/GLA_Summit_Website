import { NextPage } from "next"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useReducer } from "react"
import { LogEntry, LogViewer } from "@/Components/LogViewer"
import { myLog } from "@/lib/utils"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { Database } from "@/lib/sb_databaseModels"

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['log']['Row']
>
type SubscriptionEvent =
  | DB_SubscriptionEvent
  | {
      eventType: 'INITIALIZE'
      data: LogEntry[]
    }

const LogsPage: NextPage = () => {
  const getInitialLogs = async () => {
    const { data, error } = await supabase.from('log').select('*')
    if (error) throw error;
    return data
  }

  
  const logEntryReducer = (cachedEntries: LogEntry[], payload: SubscriptionEvent) => {
    switch(payload.eventType) {
      case 'INSERT':
        return cachedEntries.concat(payload.new)
      case 'DELETE':
        return cachedEntries.filter(({id}) => id !== payload.old.id)
      case 'UPDATE':
        return cachedEntries.map((e) => {
          return e.id === payload.new.id ? payload.new : e
        })
      case 'INITIALIZE':
        return payload.data
    }
  }

  const [logEntries, updateLogEntries] = useReducer(logEntryReducer, [])
        
  useEffect(() => {
    getInitialLogs().then(logs => {
      updateLogEntries({
        eventType: 'INITIALIZE',
        data: logs
      })
    })
  }, [])

  useEffect(() => {
    myLog('adding subscription')
    const subscription = supabase.channel('public:log')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'log'
      },
      (payload: DB_SubscriptionEvent) => { updateLogEntries(payload) }
    ).subscribe()

    return () => {
      myLog('unsubscribing')
      subscription.unsubscribe()
    }
  }, [])

  return (
    <LogViewer entries={logEntries} />
  )
}

export default LogsPage
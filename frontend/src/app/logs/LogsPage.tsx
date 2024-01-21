'use client';

import { useEffect, useReducer } from 'react';
import { LogEntry, LogViewer } from '@/Components/LogViewer';
import { Database } from '@/lib/sb_databaseModels';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { myLog } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['log']['Row']
>;
type SubscriptionEvent =
  | DB_SubscriptionEvent
  | {
      eventType: 'INITIALIZE';
      data: LogEntry[];
    };

type LogsPageProps = {
  serverLogs: LogEntry[];
};

const LogsPage = ({ serverLogs }: LogsPageProps) => {
  const logEntryReducer = (
    cachedEntries: LogEntry[],
    payload: SubscriptionEvent
  ) => {
    switch (payload.eventType) {
      case 'INSERT':
        return cachedEntries.concat(payload.new);
      case 'DELETE':
        return cachedEntries.filter(({ id }) => id !== payload.old.id);
      case 'UPDATE':
        return cachedEntries.map((e) => {
          return e.id === payload.new.id ? payload.new : e;
        });
      case 'INITIALIZE':
        return payload.data;
    }
  };

  const [logEntries, updateLogEntries] = useReducer(
    logEntryReducer,
    serverLogs
  );

  useEffect(() => {
    myLog('adding subscription');
    const subscription = supabase
      .channel('public:log')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'log'
        },
        (payload: DB_SubscriptionEvent) => {
          updateLogEntries(payload);
        }
      )
      .subscribe();

    return () => {
      myLog('unsubscribing');
      subscription.unsubscribe();
    };
  }, []);

  return <LogViewer entries={logEntries} />;
};

export default LogsPage;

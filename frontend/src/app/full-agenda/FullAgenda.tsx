'use client';
import { useEffect, useReducer, useState } from 'react';
import { Agenda, ScheduledAgendaEntry } from '@/Components/Agenda/Agenda';
import type { Database } from '@/lib/sb_databaseModels';
import type {
  RealtimePostgresChangesPayload,
  User
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { ContainerHint } from '@/Components/Agenda/AgendaCalculations';
import { myLog } from '@/lib/utils';
import { startDate } from '../configConstants';

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['agenda_favourites']['Row']
>;
type SubscriptionEvent =
  | DB_SubscriptionEvent
  | { eventType: 'INITIALIZE'; data: string[] };

export const FullAgenda = (props: {
  fullAgenda: ScheduledAgendaEntry[];
  containerHints: ContainerHint[];
}) => {
  const [user, setUser] = useState<User>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        setUser(data.user);
      }
    });
  }, [supabase]);

  const { fullAgenda, containerHints } = props;

  const [hoursToShow, setHoursToShow] = useState(4.5);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHoursToShow(window.matchMedia('(min-width: 768px)').matches ? 6 : 3);
    }
  }, []);

  const favouriteReducer = (
    cachedFavourites: string[],
    payload: SubscriptionEvent
  ) => {
    switch (payload.eventType) {
      case 'INITIALIZE':
        return payload.data;
      case 'INSERT':
        return cachedFavourites.concat(payload.new.presentation_id);
      case 'UPDATE':
        // probably doesn't happen?
        return cachedFavourites;
      case 'DELETE':
        return cachedFavourites.filter(
          (f) => f !== payload.old.presentation_id
        );
    }
  };

  const [userFavIds, setUserFavs] = useReducer(favouriteReducer, []);

  useEffect(() => {
    // If not signed in, should return empty array
    if (typeof user === 'undefined') {
      return;
    }
    try {
      supabase
        .from('agenda_favourites')
        .select('presentation_id')
        .then(({ data, error }) => {
          if (error) throw error;
          return data.map((r) => r.presentation_id);
        })
        .then((favourites) => {
          setUserFavs({ eventType: 'INITIALIZE', data: favourites });
        });
    } catch (err) {
      return;
    }
  }, [user]);

  useEffect(() => {
    myLog('adding subscription');
    const subscription = supabase
      .channel('public:agenda_favourites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agenda_favourites'
        },
        (payload: DB_SubscriptionEvent) => {
          setUserFavs(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showFavourites = false;
  const favouriteIds = showFavourites ? userFavIds : undefined;

  const unableToRenderElem = (
    <p>Unable to load this year&apos;s agenda. Please try again later.</p>
  );

  if (fullAgenda === null) {
    return unableToRenderElem;
  }

  if (typeof window !== 'undefined') {
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
      setHoursToShow(e.matches ? 6 : 3);
    });
  }

  return (
    <Agenda
      agendaEntries={fullAgenda}
      hoursToShow={hoursToShow}
      startDate={startDate}
      durationInHours={24}
      favourites={favouriteIds}
      containerHints={containerHints}
    />
  );
};

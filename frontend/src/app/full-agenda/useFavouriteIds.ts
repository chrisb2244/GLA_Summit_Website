import { useEffect, useReducer, useState } from 'react';
import type {
  RealtimePostgresChangesPayload,
  User
} from '@supabase/supabase-js';
import type { Database } from '@/lib/sb_databaseModels';
import { supabase } from '@/lib/supabaseClient';

type DB_SubscriptionEvent = RealtimePostgresChangesPayload<
  Database['public']['Tables']['agenda_favourites']['Row']
>;
type SubscriptionEvent =
  DB_SubscriptionEvent | { eventType: 'INITIALIZE'; data: string[] };

export const useFavouriteIds = (enabled: boolean) => {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (!enabled) return;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUser(data.user);
    });
  }, [enabled]);

  const [favouriteIds, setFavourites] = useReducer(
    (cached: string[], payload: SubscriptionEvent) => {
      switch (payload.eventType) {
        case 'INITIALIZE':
          return payload.data;
        case 'INSERT':
          return cached.concat(payload.new.presentation_id);
        case 'UPDATE':
          // probably doesn't happen?
          return cached;
        case 'DELETE':
          return cached.filter((f) => f !== payload.old.presentation_id);
      }
    },
    []
  );

  useEffect(() => {
    // Not signed in: RLS scopes the table to the caller, so there is nothing
    // to fetch.
    if (!enabled || typeof user === 'undefined') return;
    supabase
      .from('agenda_favourites')
      .select('presentation_id')
      .then(({ data, error }) => {
        if (error || !data) return;
        setFavourites({
          eventType: 'INITIALIZE',
          data: data.map((r) => r.presentation_id)
        });
      });
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled || !user) return;

    const subscription = supabase
      .channel('public:agenda_favourites')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agenda_favourites' },
        (payload: DB_SubscriptionEvent) => setFavourites(payload)
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, user]);

  return enabled ? favouriteIds : undefined;
};

// Functions in this file use an anonymous server-suitable Supabase client to access data
// No user-specific data is available in these functions
import { createClient as sb_createClient } from '@supabase/supabase-js';
import type { Database } from '../sb_databaseModels';
import { SummitYear } from '../databaseModels';
import { unstable_cache as nextjs_cache } from 'next/cache';
import { logErrorToDb } from '../utils';
import { PersonDisplayProps } from '@/Components/PersonDisplay';
import { getPeople_Authed } from './authorized';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const createClient = () => {
  return sb_createClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Get the presenter IDs of all accepted presentations
 * @param year The year of the presentations to fetch. If not provided, fetches all years.
 * @returns An array of unique presenter IDs
 * @throws Error if the request fails
 *
 * This function is cached with the 'getAcceptedPresenterIds' tag
 */
export const getAcceptedPresenterIds = nextjs_cache(
  async (year?: SummitYear) => {
    const supabase = createClient();
    const query = supabase
      .from('accepted_presentations')
      .select(
        'presentation_submissions(presentation_presenters(presenter_id))'
      );
    if (typeof year !== 'undefined') {
      query.eq('year', year);
    }

    const { data, error } = await query;
    if (error) {
      logErrorToDb(`getAcceptedPresenterIds: ${error.message}`, 'error');
      throw error;
    }

    const presenterIds = data.flatMap(({ presentation_submissions }) => {
      return (
        presentation_submissions?.presentation_presenters.map(
          (p) => p.presenter_id
        ) ?? []
      );
    });

    const uniquePresenterIds = [...new Set(presenterIds)];
    return uniquePresenterIds;
  },
  ['getAcceptedPresenterIds'],
  {
    revalidate: 1200,
    tags: ['getAcceptedPresenterIds']
  }
);

/**
 * Get profile information for an array of user IDs
 * @param ids An array of user IDs
 * @returns An array of user profiles
 * @throws Error if the request fails
 *
 * This function is cached with the 'getPeople' tag
 */
export const getPeople = nextjs_cache(
  async (
    ids: string[]
  ): Promise<
    Array<PersonDisplayProps & { id: string; updated_at: string }>
  > => {
    const anonClient = createClient();
    return getPeople_Authed(ids, anonClient);
  },
  ['getPeople'],
  {
    revalidate: 1200, // TODO: Remove this once we provide a trigger to revalidate the cache
    tags: ['getPeople']
  }
);

export const getPerson = nextjs_cache(
  async (id: string) => {
    return getPeople([id]).then((people) => people[0]);
  },
  ['db:presenters:getPerson'],
  {
    tags: ['db:presenters:getPerson']
  }
);

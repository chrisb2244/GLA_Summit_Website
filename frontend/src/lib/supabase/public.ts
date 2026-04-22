// Functions in this file use an anonymous server-suitable Supabase client to access data
// No user-specific data is available in these functions
import { createClient as sb_createClient } from '@supabase/supabase-js';
import type { Database } from '../sb_databaseModels';
import { SummitYear } from '../databaseModels';
import { cacheLife, cacheTag } from 'next/cache';
import { logErrorToDb } from '../utils';
import { PersonDisplayProps } from '@/Components/PersonDisplay';
import { getPeople_Authed } from './authorized';
import { cacheTagForPerson, CACHE_TAGS } from './cacheTags';

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
export const getAcceptedPresenterIds = async (year?: SummitYear) => {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.acceptedPresenterIds);

  const supabase = createClient();
  const query = supabase
    .from('accepted_presentations')
    .select(
      'presentation_submissions(presentation_presenters(presenter_id))'
    );
  if (typeof year !== 'undefined') {
    query.eq('year', year);
    cacheTag(`${CACHE_TAGS.acceptedPresenterIds}:${year}`);
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
};

/**
 * Get profile information for an array of user IDs
 * @param ids An array of user IDs
 * @returns An array of user profiles
 * @throws Error if the request fails
 *
 * This function is cached with the 'getPeople' tag
 */
export const getPeople = async (
  ids: string[]
): Promise<
  Array<PersonDisplayProps & { id: string; updated_at: string }>
> => {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.people);
  ids.forEach((id) => cacheTag(cacheTagForPerson(id)));

  const anonClient = createClient();
  return getPeople_Authed(ids, anonClient);
};

export const getPerson = async (id: string) => {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.people, cacheTagForPerson(id));

  return getPeople([id]).then((people) => people[0]);
};

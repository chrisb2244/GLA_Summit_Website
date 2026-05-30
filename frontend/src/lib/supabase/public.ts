// Functions in this file use an anonymous server-suitable Supabase client to access data
// No user-specific data is available in these functions
import { createClient as sb_createClient } from '@supabase/supabase-js';
import type { Database } from '../sb_databaseModels';
import { SummitYear } from '../databaseModels';
import { cacheLife, cacheTag } from 'next/cache';
import { logToDb } from '../utils';
import { PersonDisplayProps } from '@/Components/PersonDisplay';
import { getPeople_Authed } from './authorized';
import {
  cacheTagForPerson,
  cacheTagForPresentation,
  cacheTagForPresentationVideo,
  CACHE_TAGS
} from './cacheTags';
import { getPublicPresentation, getVideoLink } from '../databaseFunctions';
import type { PresentationModel } from '../databaseModels';

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
      'presentation_submissions(presentation_presenters(presenter_id, status))'
    );
  if (typeof year !== 'undefined') {
    query.eq('year', year);
    cacheTag(`${CACHE_TAGS.acceptedPresenterIds}:${year}`);
  }

  const { data, error } = await query;
  if (error) {
    logToDb('error', 'Failed to fetch accepted presenter IDs', 'db/public', {
      context: { message: error.message, code: error.code }
    });
    throw error;
  }

  const presenterIds = data.flatMap(({ presentation_submissions }) => {
    return (
      presentation_submissions?.presentation_presenters
        .filter((p) => p.status === 'accepted')
        .map((p) => p.presenter_id) ?? []
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
 * Each entry is tagged per-person (cacheTagForPerson), so editing one profile
 * invalidates exactly the entries that contain that person.
 */
export const getPeople = async (
  ids: string[]
): Promise<
  Array<PersonDisplayProps & { id: string; updated_at: string }>
> => {
  'use cache';
  cacheLife('weeks');
  ids.forEach((id) => cacheTag(cacheTagForPerson(id)));

  const anonClient = createClient();
  return getPeople_Authed(ids, anonClient);
};

/**
 * Get a single person's profile.
 *
 * Delegates to the cached, batched {@link getPeople} (a single DB query, cached
 * and tagged per-person) rather than wrapping its own `'use cache'` boundary,
 * which would create a second, duplicate cache entry for the same data.
 */
export const getPerson = async (id: string) => {
  return getPeople([id]).then((people) => people[0]);
};

/**
 * Cached public presentation data (the raw `get_all_presentations` row).
 *
 * Shared between the presentation page and its `generateMetadata` so both read
 * from the same cache entry. Tagged so edits made through the site can
 * invalidate it via {@link cacheTagForPresentation}.
 */
export const getCachedPublicPresentation = async (
  presentationId: string
): Promise<PresentationModel> => {
  'use cache';
  cacheLife('publicContent');
  cacheTag(cacheTagForPresentation(presentationId));

  return getPublicPresentation(presentationId, createClient());
};

/**
 * Cached video link for a presentation. Tagged via
 * {@link cacheTagForPresentationVideo} for on-demand invalidation.
 */
export const getCachedVideoLink = async (
  presentationId: string
): Promise<string | null> => {
  'use cache';
  cacheLife('publicContent');
  cacheTag(cacheTagForPresentationVideo(presentationId));

  return getVideoLink(presentationId, createClient());
};

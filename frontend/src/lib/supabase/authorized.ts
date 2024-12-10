// Functions in this file use a signed-in server-suitable Supabase client to access data
// As a result, requests are dynamic (they will typically require cookies for the client)

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../sb_databaseModels';
import { logErrorToDb } from '../utils';

export const getPeople_Authed = async (
  ids: string[],
  client: SupabaseClient<Database>
) => {
  const query = client.from('profiles').select().in('id', ids);

  const { data, error } = await query;
  if (error) {
    logErrorToDb(
      `getPeople_Authed: ${error.message}`,
      'error',
      await client.auth
        .getSession()
        .then(({ data, error }) =>
          error ? undefined : data.session?.user.id ?? undefined
        )
    );
    throw error;
  }

  return data.map((person) => {
    const avatarUrl = person.avatar_url
      ? getAvatarPublicUrl(person.avatar_url, client)
      : null;
    return {
      id: person.id,
      firstName: person.firstname,
      lastName: person.lastname,
      description:
        person.bio ?? 'This presenter has not provided a description',
      image: avatarUrl,
      updated_at: person.updated_at
    };
  });
};

/**
 * Get the public URL for an avatar image
 * @param avatarUrl The avatar URL from the database
 * @returns The public URL for the avatar image
 *
 * This function does not perform network requests, so does not require caching
 * It also does not guarantee the URL is accessible or that the file exists
 */
const getAvatarPublicUrl = (
  avatarUrl: string | null,
  client: SupabaseClient
) => {
  if (avatarUrl === null) {
    return null;
  }

  const {
    data: { publicUrl }
  } = client.storage.from('avatars').getPublicUrl(avatarUrl);
  return publicUrl;
};

import { createServerClient } from '../supabaseServer';
import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { cacheTagForPerson } from './cacheTags';
import type { ProfileModel } from '../databaseModels';

// supabase.auth.getUser
export const getUser = cache(async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
});

export const getUserDataForMenu = async () => {
  'use cache: private';
  cacheLife('default');

  const user = await getUser();
  if (!user) {
    return null;
  }

  cacheTag(cacheTagForPerson(user.id));

  const supabase = await createServerClient();

  const { count: organizerCount } = await supabase
    .from('organizers')
    .select('id', { head: true, count: 'exact' })
    .eq('id', user.id);

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, bio, website, avatar_url, updated_at')
    .eq('id', user.id)
    .single();

  return {
    user,
    isOrganizer: (organizerCount ?? 0) === 1,
    profile: (profile ?? null) as ProfileModel['Row'] | null
  };
};

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

// Wrapped in React's `cache()` for request-scoped deduplication: this is called
// independently in several server components within a single render (the user
// menu in the layout and the /review-submissions organizer gate), and the
// `'use cache: private'` directive re-executes on every server render rather
// than memoizing within one. React `cache()` adds zero-serialization intra-request
// dedup on top of the cross-navigation/tag-based caching `'use cache: private'`
// provides — the two compose rather than conflict.
export const getUserDataForMenu = cache(async () => {
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
});

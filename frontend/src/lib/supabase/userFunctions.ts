import { createServerClient } from '../supabaseServer';
import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { connection } from 'next/server';
import { cacheTagForPerson } from './cacheTags';
import type { ProfileModel } from '../databaseModels';

// supabase.auth.getSession — reads the session from the request cookies with no
// network round-trip (unlike getUser, which validates the JWT against the Auth
// server). The returned session is client-controlled, so only use this for UX
// short-circuits (e.g. bouncing an already-logged-in visitor off /auth/login),
// never for authorization.
export const getSession = cache(async () => {
  // See getUser: auth-js reads Date.now() while loading the session.
  await connection();
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data.session;
});

// supabase.auth.getUser, with no scope guard. auth-js compares the session's
// expiry with Date.now() before validating the JWT, which Next forbids during a
// prerender — so call this only from a scope where that's allowed: below
// connection() (getUser) or inside 'use cache: private' (getUserDataForMenu).
const loadUser = async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
};

// Request-time only. Under partialPrefetching a route whose shell reads
// cookies/params is prerendered per request, with cookies resolved, so without
// connection() loadUser's Date.now() is reached mid-prerender and Next logs
// "encountered the unstable value `Date.now()` while prerendering" on every
// authenticated route. This is the authorization check, so it stays uncached.
// Not callable inside 'use cache' / 'use cache: private' (connection() is
// prohibited there) — use loadUser via getUserDataForMenu instead.
export const getUser = cache(async () => {
  await connection();
  return loadUser();
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

  // loadUser, not getUser: connection() is prohibited in this scope, and the
  // private cache already permits auth-js's Date.now().
  const user = await loadUser();
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

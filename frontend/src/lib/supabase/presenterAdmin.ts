import { createServerClient } from '../supabaseServer';
import { getUser } from './userFunctions';

/**
 * Membership check for the presenter-creation panel (/admin/create-presenter).
 *
 * Mirrors the log_viewers gate on /logs: the query runs through the *user's* own
 * session client, so the "Select yourself" RLS policy on presenter_admins means a
 * non-member simply gets no rows back. Never use the admin client here — it
 * bypasses RLS and would report every membership row as the caller's own.
 *
 * Both the page (to decide whether to render) and the server action (to decide
 * whether to act) call this. The action must re-check: the page gate only
 * controls what is rendered, and a server action is an independent entry point
 * that can be invoked without ever loading the page.
 */
export const isPresenterAdmin = async (): Promise<boolean> => {
  const user = await getUser();
  if (user === null) {
    return false;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('presenter_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || data === null) {
    return false;
  }
  return data.user_id === user.id;
};

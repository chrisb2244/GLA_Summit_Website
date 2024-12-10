import { cookies } from 'next/headers';
import type { Database } from './sb_databaseModels';
import { createServerClient as sb_createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const createServerClient = async () => {
  const cookieStore = await cookies();

  // Can't set cookies in a server component (need middleware, route handler or server action)
  return sb_createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => {
        return cookieStore.getAll();
      },
      setAll: (cookies) => {
        try {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          // The 'setAll' method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
          console.log(error);
        }
      }
    },
    auth: {
      // Don't auto-refresh tokens in server components (can't set cookies)
      autoRefreshToken: false
    }
  });
};

// Seems Supabase has unified the server side client calls.
// These are kept for transition and potentially future splitting again.
export const createServerComponentClient = createServerClient;
export const createServerActionClient = createServerClient;
export const createRouteHandlerClient = createServerClient;

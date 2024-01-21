import { cookies } from 'next/headers';
import { Database } from './sb_databaseModels';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const createServerComponentClient = () => {
  const cookieStore = cookies();

  // Can't set cookies in a server component (need middleware, route handler or server action)
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value
    },
    auth: {
      // Don't auto-refresh tokens in server components (can't set cookies)
      autoRefreshToken: false
    }
  });
};

export const createServerActionClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        cookieStore.set({ name, value, ...options });
      },
      remove: (name: string, options: CookieOptions) => {
        cookieStore.set({ name, value: '', ...options });
      }
    }
  });
};

export const createRouteHandlerClient = () => {
  return createServerActionClient();
};

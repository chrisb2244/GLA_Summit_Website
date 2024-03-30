import { cookies } from 'next/headers';
import { Database } from '../sb_databaseModels';
import { createServerClient } from '@supabase/ssr';
import { cache } from 'react'; // For the duration of a single request

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// supabase.auth.getUser
export const getUser = cache(async () => {
  const cookieStore = cookies();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value
    }
  });

  return await supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      return null;
    }
    return data.user;
  });
});

// supabase.storage get profile image (by size)

// set profile image

// authentication (verifyOtp, generateLink, signOut)

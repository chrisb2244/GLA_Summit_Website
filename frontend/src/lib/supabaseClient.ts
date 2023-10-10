import { createClient } from '@supabase/supabase-js';
import type { Database } from './sb_databaseModels';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string;

export const supabase = createClientComponentClient<Database>();
//supabaseUrl, supabaseAnonKey, {
// cookieOptions: {
//   lifetime: 7 * 24 * 60 * 60 // 1 week
// }
// })
// This is only going to be available on the server - the lack of
// a "NEXT_PUBLIC" prefix makes the necessary key unavailable in the browser.
export const createAdminClient = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false
    }
  });

export const createAnonServerClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false
    }
  });

import { cookies } from 'next/headers';
import { createServerComponentClient as sbServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './sb_databaseModels';

export const createServerComponentClient = () => {
  const cookieStore = cookies();
  return sbServerComponentClient<Database>({ cookies: () => cookieStore });
};

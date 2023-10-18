import { cookies } from 'next/headers';
import {
  createServerComponentClient as sbServerComponentClient,
  createServerActionClient as sbServerActionClient,
  createRouteHandlerClient as sbRouteHandlerClient
} from '@supabase/auth-helpers-nextjs';
import { Database } from './sb_databaseModels';

export const createServerComponentClient = () => {
  const cookieStore = cookies();
  return sbServerComponentClient<Database>({ cookies: () => cookieStore });
};

export const createServerActionClient = () => {
  const cookieStore = cookies();
  return sbServerActionClient<Database>({ cookies: () => cookieStore });
};

export const createRouteHandlerClient = () => {
  const cookieStore = cookies();
  return sbRouteHandlerClient<Database>({ cookies: () => cookieStore });
};

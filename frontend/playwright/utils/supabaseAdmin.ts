import type { Database } from '@/lib/sb_databaseModels';
import { createClient } from '@supabase/supabase-js';

// Setup an admin client (service role; bypasses RLS). Server/test-only.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string;
export const createSupabaseAdmin = () =>
  createClient<Database>(supabaseUrl, supabaseKey);

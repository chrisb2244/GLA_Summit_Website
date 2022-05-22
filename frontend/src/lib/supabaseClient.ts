import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    lifetime: 7 * 24 * 60 * 60 // 1 week
  }
})
// This is only going to be available on the server - the lack of
// a "NEXT_PUBLIC" prefix makes the necessary key unavailable in the browser.
export const createAdminClient = () =>
  createClient(supabaseUrl, supabaseServiceKey)

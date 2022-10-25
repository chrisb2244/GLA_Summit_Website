import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@supabase/auth-helpers-shared'
import type { Database } from './sb_databaseModels'

import type { NextRequest, NextResponse } from 'next/server'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceKey = process.env.SECRET_SUPABASE_SERVICE_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // cookieOptions: {
  //   lifetime: 7 * 24 * 60 * 60 // 1 week
  // }
})
// This is only going to be available on the server - the lack of
// a "NEXT_PUBLIC" prefix makes the necessary key unavailable in the browser.
export const createAdminClient = () =>
  createClient<Database>(supabaseUrl, supabaseServiceKey)

function isApiRequest(req: NextRequest | NextApiRequest): req is NextApiRequest {
  return typeof (req as NextApiRequest).headers.get === 'undefined'
}
function isApiResponse(res: NextResponse | NextApiResponse): res is NextApiResponse {
  return typeof (res as NextApiResponse).getHeader === 'function'
}

export const createServerClient_UserRLS = (req: NextRequest | NextApiRequest, res: NextResponse | NextApiResponse) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables are required!'
    );
  }

  const getRequestHeader = (key: string) => isApiRequest(req) ? req.headers[key] : req.headers.get(key) ?? undefined
  const getResponseHeader = (key: string) => {
    if (isApiResponse(res)) {
      const header = res.getHeader(key);
      if (typeof header === 'number') {
        return String(header);
      }
      return header;
    } else {
      return res.headers.get(key) ?? undefined
    }
  }
  const setHeader = (key: string, value: string | string[]) => {
    if (isApiResponse(res)) {
      return res.setHeader(key, value)
    } else {
      if (Array.isArray(value)) {
        value.forEach((v) => res.headers.append(key, v));
      } else {
        return res.headers.set(key, value);
      }
    }
  }

  const supabase = createServerSupabaseClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    getRequestHeader,
    getResponseHeader,
    setHeader
  });

  return supabase
}

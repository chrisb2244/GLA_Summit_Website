import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './lib/sb_databaseModels'

// Second arg is "event: NextFetchEvent"
export async function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect('/')
  }

  const targetPath = req.nextUrl.pathname
  const res = NextResponse.next()

  // This is called before returning to refresh the cookie-based session.
  const supabase = createMiddlewareClient<Database>({ req, res })
  // getSession only performs network operations if the session exists but has expired
  // With no session or a valid session, only the storage method is accessed (e.g. cookies)
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const pathsToFilter = ['/review-submissions']

  if (!pathsToFilter.includes(targetPath)) {
    return res
  }

  const denyAccess = () =>
    NextResponse.redirect(new URL('/access-denied', req.url))

  const user = session?.user
  if (user === null || typeof user === 'undefined') {
    return denyAccess()
  }
  const isOrganizer =
    (await supabase.from('organizers').select('*').eq('id', user.id)).count !==
    0
  if (!isOrganizer) {
    return denyAccess()
  }

  return res
}

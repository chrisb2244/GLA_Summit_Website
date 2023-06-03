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
  const supabase = createMiddlewareClient<Database>({ req, res })
  await supabase.auth.getSession()

  const pathsToFilter = ['/review-submissions']

  if (!pathsToFilter.includes(targetPath)) {
    return res
  }

  const denyAccess = () =>
    NextResponse.redirect(new URL('/access-denied', req.url))
  const user = (await supabase.auth.getUser()).data.user
  if (user === null) {
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

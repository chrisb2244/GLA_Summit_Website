import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import { withMiddlewareAuth } from '@supabase/auth-helpers-nextjs'
import { createAdminClient } from './lib/supabaseClient'

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const targetPath = req.nextUrl.pathname

  const pathsToFilter = [
    '/review-submissions',
    '/api/presentation_submissions',
    '/logs'
  ]

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    return NextResponse.redirect('/');
  }

  if (!pathsToFilter.includes(targetPath)) {
    return NextResponse.next()
  }
  console.log(targetPath)
  const mw = withMiddlewareAuth({
    authGuard: {
      redirectTo: '/access-denied',
      isPermitted: async (user, supabase) => {
        if (
          targetPath.startsWith('/review-submissions') ||
          targetPath.startsWith('/api/presentation_submissions')
        ) {
          if (user === null) {
            return false
          }

          const isOrganizer =
            (await supabase.from('organizers').select('*').eq('id', user.id))
              .count !== 0
          return isOrganizer
        }

        if (targetPath.startsWith('/logs')) {
          const client = createAdminClient()
          const { data, error } = await client
            .from('log_viewers')
            .select('user_id')
          if (error || user === null) {
            return false
          }
          const allowedIds: string[] = data.map((value) => value.user_id)
          return allowedIds.includes(user.id)
        }

        return true
      }
    }
  })
  return mw(req, event)
}

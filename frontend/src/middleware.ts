import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminClient,
  createServerClient_UserRLS
} from './lib/supabaseClient'
import { myLog } from './lib/utils'

export async function middleware(req: NextRequest) {
  const targetPath = req.nextUrl.pathname
  const deniedUrl = req.nextUrl.origin + '/access-denied'

  const res = NextResponse.next()
  const supabase = createServerClient_UserRLS(req, res)
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (
    targetPath.startsWith('/review-submissions') ||
    targetPath.startsWith('/api/presentation_submissions')
  ) {
    if (error || user === null) {
      if (error && error.name !== 'AuthApiError') {
        myLog({ m: 'User was null, or an error occurred', user, error })
      }
      return NextResponse.redirect(deniedUrl)
    }

    const isOrganizer =
      (await supabase.from('organizers').select('*').eq('id', user.id))
        .count !== 0

    if (isOrganizer) {
      return NextResponse.rewrite(req.url)
    } else {
      return NextResponse.redirect(deniedUrl)
    }
  }

  if (targetPath.startsWith('/logs')) {
    const client = createAdminClient()
    const { data, error } = await client.from('log_viewers').select('user_id')
    if (error || user === null) {
      return NextResponse.redirect(deniedUrl)
    }
    const allowedIds: string[] = data.map((value) => value.user_id)
    if (allowedIds.includes(user.id)) {
      return NextResponse.rewrite(req.url)
    } else {
      return NextResponse.redirect(deniedUrl)
    }
  }
}

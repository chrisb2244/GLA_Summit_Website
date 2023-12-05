import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './lib/sb_databaseModels';

// Second arg is "event: NextFetchEvent"
export async function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect('/');
  }

  const targetPath = req.nextUrl.pathname;
  const res = NextResponse.next();

  // This is called before returning to refresh the cookie-based session.
  const supabase = createMiddlewareClient<Database>({ req, res });
  // getSession only performs network operations if the session exists but has expired
  // With no session or a valid session, only the storage method is accessed (e.g. cookies)
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const pathsRequiringLogin = ['/my-profile', '/my-presentations'];
  const pathsRequiringOrganizer = ['/review-submissions', '/logs'];
  const pathsRequiringSomeAuth = [
    ...pathsRequiringLogin,
    ...pathsRequiringOrganizer
  ];

  if (!pathsRequiringSomeAuth.includes(targetPath)) {
    // public page
    return res;
  }

  const user = session?.user;
  if (user === null || typeof user === 'undefined') {
    return NextResponse.rewrite(new URL('/login-required', req.url));
  }

  if (!pathsRequiringOrganizer.includes(targetPath)) {
    // required login but no requirement for organizer
    return res;
  }

  const isOrganizer =
    (await supabase.from('organizers').select('*').eq('id', user.id)).count !==
    0;
  if (!isOrganizer) {
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  // is organizer, required organizer
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (json file for presentations)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico).*)'
  ]
};

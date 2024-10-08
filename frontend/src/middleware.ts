import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase/middlewareUpdater';

// Second arg is "event: NextFetchEvent"
export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect('/');
  }

  let { response, user, supabase } = await updateSession(request);
  const targetPath = request.nextUrl.pathname;

  const pathsRequiringLogin = ['/my-profile', '/my-presentations'];
  const pathsRequiringOrganizer = ['/review-submissions', '/logs'];
  const pathsRequiringSomeAuth = [
    ...pathsRequiringLogin,
    ...pathsRequiringOrganizer
  ];

  if (!pathsRequiringSomeAuth.includes(targetPath)) {
    // public page
    return response;
  }

  // const user = session?.user;
  if (user === null || typeof user === 'undefined') {
    return NextResponse.rewrite(new URL('/login-required', request.url));
  }

  if (!pathsRequiringOrganizer.includes(targetPath)) {
    // required login but no requirement for organizer
    return response;
  }

  const isOrganizer =
    (await supabase.from('organizers').select('*').eq('id', user.id)).count !==
    0;
  if (!isOrganizer) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  // is organizer, required organizer
  return response;
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
    {
      source:
        '/((?!_next/static|_next/image|_next/data|favicon.ico|media/GLA-logo|media/privacypolicy|icon.ico).*)',
      // Exclude prefetches from next/link
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};

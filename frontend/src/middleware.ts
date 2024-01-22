import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './lib/sb_databaseModels';

// Second arg is "event: NextFetchEvent"
export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return NextResponse.redirect('/');
  }

  const targetPath = request.nextUrl.pathname;
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  // This is called before returning to refresh the cookie-based session.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value: '',
            ...options
          });
        }
      }
    }
  );

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
    return response;
  }

  const user = session?.user;
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
    '/((?!_next/static|_next/image|_next/data|favicon.ico).*)'
  ],
  regions: ['iad1']
};

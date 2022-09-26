import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/sb_databaseModels";
import { createServerSupabaseClient } from "@supabase/auth-helpers-shared";
import { myLog } from "@/lib/utils";

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  const targetUrl = req.url
  const deniedUrl = req.nextUrl.origin + '/access-denied'
  
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables are required!'
    );
  }

  const res = NextResponse.next()

  const supabase = createServerSupabaseClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    getRequestHeader: (key) => req.headers.get(key) ?? undefined,
    getResponseHeader: (key) => res.headers.get(key) ?? undefined,
    setHeader: (key, value) => {
      if (Array.isArray(value)) {
        value.forEach((v) => res.headers.append(key, v));
      } else {
        res.headers.set(key, value);
      }
    }
  });

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || user === null) {
    if(error && error.name !== 'AuthApiError') {
      myLog({m: 'User was null, or an error occurred', user, error})
    }
    return NextResponse.redirect(deniedUrl)
  }
  const isOrganizer = (await supabase.from('organizers').select('*').eq('id', user.id)).count !== 0

  if (isOrganizer) {
    return NextResponse.rewrite(targetUrl);
  } else {
    return NextResponse.redirect(deniedUrl)
  }
}
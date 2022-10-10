import { NextRequest, NextResponse } from "next/server";
import { myLog } from "@/lib/utils";
import { createServerClient_UserRLS } from "@/lib/supabaseClient";

export const middleware = async (req: NextRequest): Promise<NextResponse> => {
  const targetUrl = req.url
  const deniedUrl = req.nextUrl.origin + '/access-denied'
  const res = NextResponse.next()
  
  const supabase = createServerClient_UserRLS(req, res)

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
import { createAdminClient } from "@/lib/supabaseClient";
import { withMiddlewareAuth } from "@supabase/auth-helpers-nextjs";

export const middleware = withMiddlewareAuth({
  redirectTo: '/access-denied',
  authGuard: {
    redirectTo: '/access-denied',
    isPermitted: async (user) => {
      const client = createAdminClient()
      const { data, error } = await client.from('log_viewers').select('user_id')
      if (error) {
        return false
      }
      const allowedIds: string[] = data.map(value => value.user_id)
      return allowedIds.includes(user.id)
    },
  }
})
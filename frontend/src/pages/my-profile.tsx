import { UserProfile } from '@/Components/User/UserProfile'
import { supabase } from '@/lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const MyProfile = (): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null)
  useEffect(() => {
    setSession(supabase.auth.session())
    supabase.auth.onAuthStateChange((_ev, session) => {
      setSession(session)
    })
  }, [session])

  return <UserProfile session={session} />
}

export default MyProfile

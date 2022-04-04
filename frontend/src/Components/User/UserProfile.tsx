import { getProfileInfo } from '@/lib/supabaseClient'
import type { ProfileModel } from '@/lib/supabaseClient'
import type { PostgrestError, Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'



export const UserProfile: React.FC<{ session: Session | null }> = ({ session }) => {
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileModel | null>(null)

  useEffect(() => {
    setLoading(true)
    getProfileInfo().then(data => {
      setProfileData(data)
    }).catch((error) => {
      console.log(error as PostgrestError)
    })
    setLoading(false)
  }, [session])

  if (session == null || session.user == null) {
    return <p>You are not signed in</p>
  } else {
    if (profileData == null) {
      return <p>Profile not loaded</p>
    }
    return (
      <>
        <div>Name: {profileData.firstname + ' ' + profileData.lastname}</div>
        <div>Email: {session.user.email}</div>
      </>
    )
  }
}

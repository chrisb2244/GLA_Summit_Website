import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Person } from '@/Components/Person'
import { ProfileModel } from '@/lib/databaseModels'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

const MyProfile = (): JSX.Element => {
  const [allProfiles, setAllProfiles] = useState<Array<ProfileModel>>([])
  const getProfiles = async () => {
    const { data, error } = await supabase
      .from<ProfileModel>('profiles')
      .select('*')
      .order('lastname', { ascending: true })
    if (error) throw error
    if (data) setAllProfiles(data)
  }

  useEffect(() => {
    getProfiles()
  }, [])

  const getAvatarPublicUrl = (userAvatarUrl: string) => {
    const { error, publicURL } = supabase.storage
      .from('avatars')
      .getPublicUrl(userAvatarUrl)
    if (error) throw error
    return publicURL
  }

  const renderedProfiles = allProfiles.map((user) => {
    const avatarUrl = user.avatar_url
      ? getAvatarPublicUrl(user.avatar_url)
      : null

    return (
      <Person
        key={user.id}
        firstName={user.firstname}
        lastName={user.lastname}
        description={user.bio ?? ''}
        image={avatarUrl}
        useDefaultIconImage
      />
    )
  })

  return <StackedBoxes>{renderedProfiles}</StackedBoxes>
}

export default MyProfile

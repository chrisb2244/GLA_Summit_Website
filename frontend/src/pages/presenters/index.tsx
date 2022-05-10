import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay } from '@/Components/PersonDisplay'
import { ProfileModel } from '@/lib/databaseModels'
import { supabase } from '@/lib/supabaseClient'
import type { GetStaticProps } from 'next'

const getPublicProfileUserIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from<{ id: string }>('public_profiles')
    .select()
  if (error) throw error

  return data.map((elem) => elem.id)
}

const getProfilesById = async (userIds: string[]): Promise<ProfileModel[]> => {
  const { data, error } = await supabase
    .from<ProfileModel>('profiles')
    .select()
    .in('id', userIds)
    .order('lastname', { ascending: true })
  if (error) throw error
  return data
}

export const getStaticProps: GetStaticProps = async () => {
  const getProfiles = async () => {
    return getPublicProfileUserIds()
      .then((ids) => getProfilesById(ids))
      .catch((error) => {
        throw error
      })
  }

  return {
    props: {
      profiles: await getProfiles()
    }
  }
}

const AllProfiles: React.FC<{ profiles: ProfileModel[] }> = (props) => {
  const getAvatarPublicUrl = (userAvatarUrl: string) => {
    const { error, publicURL } = supabase.storage
      .from('avatars')
      .getPublicUrl(userAvatarUrl)
    if (error) throw error
    return publicURL
  }

  const renderedProfiles = props.profiles.map((user) => {
    const avatarUrl = user.avatar_url
      ? getAvatarPublicUrl(user.avatar_url)
      : null

    return (
      <PersonDisplay
        key={user.id}
        firstName={user.firstname}
        lastName={user.lastname}
        description={user.bio ?? ''}
        image={avatarUrl}
        useDefaultIconImage
        pageLink={`/presenters/${user.id}`}
      />
    )
  })

  return <StackedBoxes>{renderedProfiles}</StackedBoxes>
}

export default AllProfiles

import type { ProfileModel } from '@/lib/sessionContext'
import { supabase } from '@/lib/supabaseClient'
import { Stack } from '@mui/material'
import { RenderedProfile } from '@/Components/User/RenderedProfile'

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

export async function getStaticProps() {
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

const AllProfiles = (props: {profiles: ProfileModel[]}): JSX.Element => {
  const renderedProfiles = props.profiles.map((user) => {
    return (
      <RenderedProfile
        key={user.id}
        firstName={user.firstname}
        lastName={user.lastname}
        description={user.bio}
        imagePath={user.avatar_url}
      />
    )
  })

  return (
    <Stack spacing={2} marginBottom={2} maxWidth='lg'>
      {renderedProfiles}
    </Stack>
  )
}

export default AllProfiles

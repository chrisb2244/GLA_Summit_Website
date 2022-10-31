import { PersonDisplayProps } from '@/Components/PersonDisplay'
import type { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import { PostgrestError, User as SB_User } from '@supabase/supabase-js'
import { AllPresentationsModel, ProfileModel } from './databaseModels'
import { Database } from './sb_databaseModels'
import { supabase, createAdminClient } from './supabaseClient'
import { defaultTimezoneInfo, myLog } from './utils'

export type User = SB_User

export const checkForExistingUser = async (
  email: string
): Promise<{ userId: string | null }> => {
  return createAdminClient()
    .from('email_lookup')
    .select()
    .eq('email', email)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        console.log({ error, m: 'Searching for email-id table entry' })
        throw error
      }
      if (data) {
        return {
          userId: data.id as string
        }
      }
      return { userId: null }
    })
}

export const adminUpdateExistingProfile = async (
  userId: string,
  data: NewUserInformation
): Promise<void> => {
  const client = createAdminClient()

  const existingData = await client
    .from('profiles')
    .select('firstname,lastname')
    .eq('id', userId)
    .single()
    .then((result) => {
      if (result.data != null) {
        return result.data
      } else
        return {
          firstname: null,
          lastname: null
        }
    })

  const updatedData = {
    firstname: existingData.firstname ?? data.firstname,
    lastname: existingData.lastname ?? data.lastname
  }

  await client.from('profiles').update(updatedData).eq('id', userId)
}

type PresentationSubmissionsModel =
  Database['public']['Tables']['presentation_submissions']['Row']
type NewSubmission = Omit<PresentationSubmissionsModel, 'id' | 'updated_at'>
export const adminAddNewPresentationSubmission = async (
  content: NewSubmission
) => {
  return createAdminClient()
    .from('presentation_submissions')
    .insert(content)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data.id
    })
}
type ExistingSubmission = Omit<PresentationSubmissionsModel, 'updated_at'>
export const adminUpdateExistingPresentationSubmission = async (
  content: ExistingSubmission
) => {
  return createAdminClient()
    .from('presentation_submissions')
    .upsert(content)
    .select()
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data.id
    })
}

/* ------------------ Client side functions ---------------------------- */
export const clientUpdateExistingProfile = async (
  profileData: ProfileModel['Row']
) => {
  return (
    supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .then(({ data, error }) => {
        if (error) throw error
        if (data.length !== 1) {
          throw new Error('Unexpected data length when updating profile')
        }
        return data[0]
      })
  )
}

export const checkIfOrganizer = async (user: User) => {
  const { data, error } = await supabase
    .from('organizers')
    .select()
    .eq('id', user.id)
  if (error) {
    const err = error as PostgrestError
    const expected = 'JSON object requested, multiple (or no) rows returned'
    if (err.message === expected) {
      return false
    }
    throw error
  } else {
    return data.length > 0
  }
}

export const queryTimezonePreferences = async (user: User) => {
  const { data, error } = await supabase
    .from('timezone_preferences')
    .select()
    .eq('id', user.id)
  if (error) {
    throw new Error(error.message)
  }
  if (data.length > 0) {
    const { timezone_db, timezone_name, use_24h_clock } = data[0]
    return {
      timeZone: timezone_db,
      timeZoneName: timezone_name,
      use24HourClock: use_24h_clock
    }
  } else {
    return defaultTimezoneInfo()
  }
}

export const getProfileInfo = async (user: User) => {
  return supabase
    .from('profiles')
    .select('id, firstname, lastname, bio, website, avatar_url')
    .eq('id', user.id)
    .single()
    .then(({ data, error }) => {
      if (error) {
        throw new Error(error.message)
      } else {
        return data
      }
    })
}

export const uploadAvatar = async (
  remoteFilePath: string,
  localFile: File,
  userId: string,
  originalProfileURL: string | null
) => {
  // Upload a new file to storage
  const { error } = await supabase.storage.from('avatars').upload(remoteFilePath, localFile)
  if (error) throw error
  
  // Set that file as the profile avatar
  const { error: profileUpdateError } = await supabase
    .from('profiles').update({avatar_url: remoteFilePath}).match({'id': userId})
  if (profileUpdateError) {
    deleteAvatar(remoteFilePath)
    throw profileUpdateError
  }
  
  if (originalProfileURL != null) {
    await deleteAvatar(originalProfileURL)
  }
  return true
}

export const downloadAvatar = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url, id')
    .eq('id', userId)
    .single()
  if (error) throw error
  if (data.avatar_url == null) {
    // Found profile, but no avatar_url defined
    return null
  }

  return await supabase.storage.from('avatars')
    .download(data.avatar_url)
    .then(({data, error}) => {
      if (error) throw error
      return data
    })
}

export const getAvatarPublicUrl = (userAvatarUrl: string | null) => {
  if (userAvatarUrl == null) {
    return null
  }
  const {
    data: { publicUrl }
  } = supabase.storage.from('avatars').getPublicUrl(userAvatarUrl)
  return publicUrl
}

export const deleteAvatar = async (remotePath: string) => {
  const { data, error } = await supabase.storage
    .from('avatars')
    .remove([remotePath])
  if (error) throw error
  return data.length === 1
}

export const getPerson = async (
  userId: string
): Promise<PersonDisplayProps> => {
  return supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      const avatarUrl = data.avatar_url
        ? getAvatarPublicUrl(data.avatar_url)
        : null

      const personProps: PersonDisplayProps = {
        firstName: data.firstname ?? '',
        lastName: data.lastname ?? '',
        description:
          data.bio ?? 'This presenter has not provided a description',
        image: avatarUrl
      }
      return personProps
    })
}

export const getPublicProfileIds = async () => {
  return supabase
    .from('public_profiles')
    .select('id')
    .then(({data, error}) => {
      if (error) throw error
      const ids = data.map(({id}) => id)
      return ids
    })
}

export const getPublicProfiles = async (): Promise<ProfileModel['Row'][]> => {
  return getPublicProfileIds()
    .then((ids) => {
      return supabase
        .from('profiles')
        .select()
        .in('id', ids)
        .order('lastname', { ascending: true })
    })
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
}

export const getPublicPresentations = async () => {
  const { data, error } = await supabase.from('all_presentations')
    .select()
    .order('scheduled_for', { ascending: true })
  if (error) throw error
  return data
}
export const getPublicPresentationsForPresenter = async (presenterId: string) => {
  const { data, error } = await supabase.from('all_presentations')
    .select()
    .contains('all_presenters', [presenterId])
    .order('scheduled_for', { ascending: true })
  if (error) throw error
  return data
}


export const getPublicPresentation = async (
  presentationId: string
): Promise<AllPresentationsModel> => {
  return supabase
    .from('all_presentations')
    .select()
    .eq('presentation_id', presentationId)
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
}

export const getAcceptedPresentationIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('accepted_presentations')
    .select('id')
  if (error) throw error
  return data.map((d) => d.id)
}

export const getMyPresentations = async () => {
  const { data, error: errorPresData } = await supabase
    .from('my_submissions')
    .select()
  if (errorPresData) {
    myLog({
      error: errorPresData,
      desc: 'Failed to fetch presentation details for this user'
    })
    throw errorPresData
  }
  return data
}

export const deletePresentation = async (presentationId: string) => {
  const { error } = await supabase
    .from('presentation_submissions')
    .delete()
    .eq('id', presentationId)
  if (error) {
    myLog({ error })
    return false
  }
  return true
}

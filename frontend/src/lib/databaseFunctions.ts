import { PersonDisplayProps } from '@/Components/PersonDisplay'
import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import { PostgrestError, User } from '@supabase/supabase-js'
import {
  AllPresentationsModel,
  ProfileModel,
  TimezonePreferencesModel
} from './databaseModels'
import { supabase, createAdminClient } from './supabaseClient'
import { defaultTimezoneInfo } from './utils'

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
    .from<ProfileModel>('profiles')
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

  await client
    .from<ProfileModel>('profiles')
    .update(updatedData)
    .eq('id', userId)
}

/* ------------------ Client side functions ---------------------------- */
export const clientUpdateExistingProfile = async (
  userId: string,
  profileData: Partial<ProfileModel>
) => {
  return supabase
    .from<ProfileModel>('profiles')
    .upsert({ ...profileData, id: userId })
    .single()
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
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
    .from<TimezonePreferencesModel>('timezone_preferences')
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
    .from<ProfileModel>('profiles')
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

export const getAvatarPublicUrl = (userAvatarUrl: string | null) => {
  if (userAvatarUrl == null) {
    return null
  }
  const { error, publicURL } = supabase.storage
    .from('avatars')
    .getPublicUrl(userAvatarUrl)
  if (error) throw error
  return publicURL
}

export const getPerson = async (
  userId: string
): Promise<PersonDisplayProps> => {
  return supabase
    .from<ProfileModel>('profiles')
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

export const getPublicProfiles = async (): Promise<ProfileModel[]> => {
  return supabase
    .from<{ id: string }>('public_profiles')
    .select()
    .then(({ data, error }) => {
      if (error) throw error
      return data.map((d) => d.id)
    })
    .then((ids) => {
      return supabase
        .from<ProfileModel>('profiles')
        .select()
        .in('id', ids)
        .order('lastname', { ascending: true })
    })
    .then(({ data, error }) => {
      if (error) throw error
      return data
    })
}

export const getPublicPresentation = async (
  presentationId: string
): Promise<AllPresentationsModel> => {
  return supabase
    .from<AllPresentationsModel>('all_presentations')
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
    .from<{ id: string }>('accepted_presentations')
    .select('id')
  if (error) throw error
  return data.map((d) => d.id)
}

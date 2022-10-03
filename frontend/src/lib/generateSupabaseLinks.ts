import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import { createAdminClient } from '@/lib/supabaseClient'
import type { User, GenerateLinkResponse, AuthError, GenerateLinkProperties } from '@supabase/supabase-js'
import type { ApiError } from './sessionContext'
import {
  adminUpdateExistingProfile,
  checkForExistingUser
} from './databaseFunctions'
import { logErrorToDb, myLog } from './utils'

export type GenerateLinkBody =
  | {
      type: 'signup'
      email: string
      signUpData: {
        data?: NewUserInformation | undefined
        password: string
      }
      redirectTo?: string
    }
  | {
      type: 'magiclink' | 'invite' | 'recovery'
      email: string
      redirectTo?: string
    }

type GenerateLinkReturn =
  | {
      data: { user: User, properties: GenerateLinkProperties }
      linkType: LinkType
      error: null
    }
  | {
      data: { user: null, properties: null }
      linkType: null
      error: ApiError | AuthError
    }

export type LinkType = 'signup' | 'magiclink' | 'invite' | 'recovery'

export const generateSupabaseLinks = async (
  bodyData: GenerateLinkBody
): Promise<GenerateLinkReturn> => {
  // Need 'type', 'email', and 'options', where options is a struct with 'password', 'data' and 'redirectTo'.
  // 'data''s required/optional contents are unclear... But it might be a signup only
  // password might also be signup only (README.md in github.com/supabase/gotrue)
  // data looks to have the same format as the 'data' object accepted by signUp.
  const { type, email, redirectTo } = bodyData
  const { userId: existingId } = await checkForExistingUser(email)
  let fnPromise = null

  switch (type) {
    case 'signup': {
      const { data, password } = bodyData.signUpData
      if (existingId != null) {
        // This is an error... but want to try migrate, see issue #30.
        logErrorToDb('Attempted to create an existing user, adding data instead (id is attempted user, not signed in user)', 'info', existingId)
        if (typeof data !== 'undefined') {
          adminUpdateExistingProfile(existingId, data)
        }
        fnPromise = createAdminClient().auth.admin.generateLink({type: 'magiclink', email, options: { redirectTo }})
      } else {
        // There was no existingId (this is expected), so create new user.
        fnPromise = createAdminClient().auth.admin.generateLink({type: 'signup', email, password, options: {data, redirectTo}})
      }
      break
    }
    case 'magiclink': {
      // Workaround the inability to pass shouldCreateUser: false
      if (!existingId) {
        return {
          data: { user: null, properties: null },
          linkType: null,
          error: { message: 'User not found', status: 401 }
        }
      }
      fnPromise = createAdminClient().auth.admin.generateLink({type: 'magiclink', email, options: {redirectTo}})
      break
    }
    default: {
      throw new Error('generateLink for this type is not yet implemented')
    }
  }
  return fnPromise.then(response => handleApiResponse(response, type))
}

// This function needs to return the new userId for the invited account
export const generateInviteLink = async (email: string, redirectTo?: string) => {
  myLog(`Inviting new user: ${email}`)

  return createAdminClient().auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo }
  }).then(({data, error}) => {
    if (error) throw error
    myLog({data})
    return {
      newUserId: data.user.id,
      confirmationLink: data.properties.action_link
    }
  })
}

const handleApiResponse = (value: GenerateLinkResponse, type: LinkType): GenerateLinkReturn => {
  const { data, error } = value
  console.log({data, error})
  if (error) {
    return { data, linkType: null, error }
  }
  return { data, linkType: type, error }
}

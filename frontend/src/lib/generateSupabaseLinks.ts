import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import { createAdminClient } from '@/lib/supabaseClient'
import type { User, Session, ApiError } from '@supabase/supabase-js'
import {
  adminUpdateExistingProfile,
  checkForExistingUser
} from './databaseFunctions'

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
      user: User
      linkType: LinkType
      error: null
    }
  | {
      user: null
      linkType: null
      error: ApiError
    }

export type LinkType = 'signup' | 'magiclink' | 'invite' | 'recovery'
type OptionsType =
  | {
      password?: string | undefined
      data?: object | undefined
      redirectTo?: string | undefined
    }
  | undefined

type SupabaseApiResponse = {
  data: Session | User | null
  error: ApiError | null
}

export const generateSupabaseLinks = async (
  bodyData: GenerateLinkBody
): Promise<GenerateLinkReturn> => {
  // Need 'type', 'email', and 'options', where options is a struct with 'password', 'data' and 'redirectTo'.
  // 'data''s required/optional contents are unclear... But it might be a signup only
  // password might also be signup only (README.md in github.com/supabase/gotrue)
  // data looks to have the same format as the 'data' object accepted by signUp.

  const { type, email, redirectTo } = bodyData
  const { userId: existingId } = await checkForExistingUser(email)

  switch (type) {
    case 'signup': {
      const { data, password } = bodyData.signUpData
      if (existingId != null) {
        // This is an error... but want to try migrate, see issue #30.
        if (typeof data !== 'undefined') {
          adminUpdateExistingProfile(existingId, data)
        }

        return makeLink('magiclink', email, { redirectTo })
      } else {
        // There was no existingId (this is expected), so create new user.
        return makeLink('signup', email, {
          password,
          data,
          redirectTo
        })
      }
    }
    case 'magiclink': {
      // Workaround the inability to pass shouldCreateUser: false
      if (!existingId) {
        return {
          user: null,
          linkType: null,
          error: { message: 'User not found', status: 401 }
        }
      }
      return makeLink('magiclink', email, { redirectTo })
    }
    default: {
      throw new Error('generateLink for this type is not yet implemented')
    }
  }
}

const makeLink = (type: LinkType, email: string, options?: OptionsType) =>
  createAdminClient()
    .auth.api.generateLink(type, email, options)
    .then(res => handleApiResponse(res, type))

const handleApiResponse = (value: SupabaseApiResponse, type: LinkType) => {
  const { data, error } = value
  if (error) {
    return { user: null, linkType: null, error }
  }
  return { user: data as User, linkType: type, error: null }
}

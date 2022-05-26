import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import { createAdminClient } from '@/lib/supabaseClient'
import type { User, Session, ApiError } from '@supabase/supabase-js'

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

type SupabaseApiResponse = {
  data: Session | User | null
  error: ApiError | null
}

export const generateSupabaseLinks = (bodyData: GenerateLinkBody) => {
  // Need 'type', 'email', and 'options', where options is a struct with 'password', 'data' and 'redirectTo'.
  // 'data''s required/optional contents are unclear... But it might be a signup only
  // password might also be signup only (README.md in github.com/supabase/gotrue)
  // data looks to have the same format as the 'data' object accepted by signUp.

  const handleApiResponse = (value: SupabaseApiResponse) => {
    const { data, error } = value
    if (error) {
      throw error
    }
    return { user: data as User }
  }

  const { type, email, redirectTo } = bodyData
  const api = createAdminClient().auth.api

  switch (type) {
    case 'signup': {
      const data = bodyData.signUpData.data
      const password = bodyData.signUpData.password
      return api
        .generateLink('signup', email, { password, data, redirectTo })
        .then(handleApiResponse)
    }
    case 'magiclink': {
      return api
        .generateLink('magiclink', email, { redirectTo })
        .then(handleApiResponse)
    }
    default: {
      throw new Error('generateLink for this type is not yet implemented')
    }
  }
}

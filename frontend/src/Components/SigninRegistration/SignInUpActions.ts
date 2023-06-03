'use server'

import { generateSupabaseLinks } from "@/lib/generateSupabaseLinks"

export const signIn = async (email: string, options?: {redirectTo?: string, scopes?: string, captchaToken?: string}) => {
  return generateSupabaseLinks({
    type: 'magiclink',
    email,
    redirectTo: options?.redirectTo
  }).then((v) => {
    console.log(v)
    return v
  })
}
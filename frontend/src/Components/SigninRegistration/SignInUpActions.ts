'use server'
import 'server-only' // Poison the module for client code.

import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NewUserInformation } from './NewUserRegistration'
import { randomBytes } from 'crypto'
import { sendMailApi } from '@/lib/sendMail'

export const mailUser = async () => {
  // Send email
}

export const verifyLogin = async (data: {
  email: string
  verificationCode: string
}) => {
  return createServerActionClient({ cookies })
    .auth.verifyOtp({
      email: data.email,
      token: data.verificationCode,
      type: 'email'
    })
    .then((res) => {
      console.log(res)
      return res.data
    })
}

export const signIn = async (
  email: string,
  options?: { redirectTo?: string; scopes?: string; captchaToken?: string }
): Promise<boolean> => {
  console.log('Generating signin link')
  return generateSupabaseLinks({
    type: 'magiclink',
    email,
    redirectTo: options?.redirectTo
  })
    .then((v) => {
      console.log(v.data)
      return true
    })
    .catch((err) => {
      console.log(err)
      return false
    })
}

export const signUp = async (
  email: string,
  info: NewUserInformation,
  redirectTo?: string
): Promise<boolean> => {
  // Sign up
  console.log('Generating signup link')
  const password = randomBytes(32).toString('hex')

  return generateSupabaseLinks({
    type: 'signup',
    email,
    signUpData: {
      password,
      data: info
    },
    redirectTo
  }).then(({ data, error }) => {
    console.log({ data, error, m: 'signup' })
    if (error) {
      return false
    }
    const subject = 'GLA Summit 2022 Website Signup'
    const user = data.user
    const link = data.properties.action_link
    const otp = data.properties.email_otp
    const plainText = 'Your One-Time-Passode (OTP) token is ' + otp + '\r\n'
    const person = {
      firstName: info.firstname,
      lastName: info.lastname,
      email
    }
    sendMailApi({
      to: email,
      subject,
      from: 'web@glasummit.org',
      bodyPlain: plainText,
      body: plainText
    })
    return true
  })
}

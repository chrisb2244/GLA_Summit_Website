'use server'
import 'server-only' // Poison the module for client code.

import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { sendMailApi } from '@/lib/sendMail'
import { PersonProps } from '../Form'

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
      return res.data.user !== null
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
    .then(async (v) => {
      if (v.data.properties == null) {
        console.log('Some error?')
        console.log(v.data)
        return false
      }
      const mailResult = await sendMailApi({
        subject: 'Validation Code for GLA Summit Login',
        to: email,
        bodyPlain: `Your One-Time Passcode is ${v.data.properties.email_otp}`
      })
      if (mailResult.status === 200) {
        return true
      } else {
        throw new Error(mailResult.message)
      }
    })
    .catch((err) => {
      console.log(`Failed to send a sign-in link: ${err}`)
      return false
    })
}

export const signUp = async (
  newUser: PersonProps,
  redirectTo?: string
): Promise<boolean> => {
  // Sign up
  console.log('Generating signup link')
  const password = randomBytes(32).toString('hex')
  const email = newUser.email

  return generateSupabaseLinks({
    type: 'signup',
    email,
    signUpData: {
      password,
      data: {
        firstname: newUser.firstName,
        lastname: newUser.lastName
      }
    },
    redirectTo
  }).then(({ data, error }) => {
    console.log({ data, error, m: 'signup' })
    if (error) {
      return false
    }
    const subject = 'GLA Summit Website Signup'
    const user = data.user
    const link = data.properties.action_link
    const otp = data.properties.email_otp
    const plainText = 'Your One-Time-Passode (OTP) token is ' + otp + '\r\n'
    sendMailApi({
      to: email,
      subject,
      bodyPlain: plainText,
      body: plainText
    })
    return true
  })
}

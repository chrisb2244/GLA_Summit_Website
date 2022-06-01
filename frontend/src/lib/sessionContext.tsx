import React, { useContext, useState, createContext, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type { Session, UserCredentials, User } from '@supabase/supabase-js'
import { ApiError } from '@supabase/supabase-js'
import { ProfileModel } from './databaseModels'
import { defaultTimezoneInfo, myLog, TimezoneInfo } from './utils'
import { GenerateLinkBody } from '@/lib/generateSupabaseLinks'
import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'
import {
  checkIfOrganizer,
  getProfileInfo,
  queryTimezonePreferences
} from '@/lib/databaseFunctions'

// Even for ValidSignIn, session and user are null using magic link via email.
type ValidSignIn = { session: Session | null; user: User | null; error: null }
type InvalidSignIn = { session: null; user: null; error: ApiError }

// If "Email Confirmations" is turned on, user is valid and session is null
// If turned off, both are valid when error: null.
type ValidSignUp = { user: User; session: Session | null; error: null }
type InvalidSignUp = { user: null; session: null; error: ApiError }

type SignInOptions = {
  redirectTo?: string
  scopes?: string
  captchaToken?: string
}

type SignUpOptions = {
  redirectTo?: string
  data?: object
  captchaToken?: string
}

type SessionContext = {
  user: User | null
  profile: ProfileModel | null
  timezoneInfo: TimezoneInfo
  isOrganizer: boolean
  isLoading: boolean
  signIn: (
    email: string,
    options?: SignInOptions
  ) => Promise<ValidSignIn | InvalidSignIn>
  signUp: (
    credentials: UserCredentials,
    options?: SignUpOptions
  ) => Promise<ValidSignUp | InvalidSignUp>
  signOut: () => Promise<{ error: ApiError | null }>
}

const AuthContext = createContext<SessionContext | undefined>(undefined)

export const AuthProvider: React.FC = (props) => {
  const [isLoading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileModel | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [timezoneInfo, setTimezoneInfo] =
    useState<TimezoneInfo>(defaultTimezoneInfo)

  const signIn = async (email: string, options?: SignInOptions) => {
    // Need the '/' to match allowed URLs in the Supabase configuration.
    const redirectTo = new URL(window.location.href).origin + '/'

    const bodyData: GenerateLinkBody = {
      email,
      type: 'magiclink',
      redirectTo
    }

    return fetch('/api/auth_links/magiclink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bodyData, redirectTo: options?.redirectTo })
    })
      .then((res) => {
        console.log(res)
        const j = res.json()
        console.log(j)
        if (res.status !== 201) {
          console.log({ statusCode: res.status, m: res.statusText })
          throw new Error(res.statusText)
        }
        return j
      })
      .catch((err) => {
        return { user: null, session: null, error: new Error(err) }
      })
  }

  const runUpdates = async (user: User | null) => {
    setUser(user)
    if (user == null) {
      return
    }
    getProfileInfo(user)
      .then(setProfile)
      .catch((error) => {
        myLog(error)
      })
    checkIfOrganizer(user)
      .then(setIsOrganizer)
      .catch((error) => {
        myLog(error)
      })
    queryTimezonePreferences(user)
      .then(setTimezoneInfo)
      .catch((error) => {
        myLog(error)
      })
  }

  useEffect(() => {
    const session = supabase.auth.session()
    runUpdates(session?.user ?? null)
    setLoading(false)

    const { data: listener } = supabase.auth.onAuthStateChange(
      (ev, session) => {
        myLog(ev)
        setLoading(true)
        runUpdates(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      listener?.unsubscribe()
    }
  }, [])

  const value: SessionContext = {
    user,
    profile,
    isOrganizer,
    isLoading,
    signIn,
    signUp,
    signOut: async () => await supabase.auth.signOut(),
    timezoneInfo
  }

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && props.children}
    </AuthContext.Provider>
  )
}

// export the useSession hook
export const useSession = () => {
  const context = useContext(AuthContext)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return context!
}

const signUp = async (cred: UserCredentials, options?: SignUpOptions) => {
  if (typeof cred.email === 'undefined') {
    return {
      user: null,
      session: null,
      error: { message: 'Undefined email passed', status: 401 }
    }
  }
  if (typeof cred.password === 'undefined') {
    return {
      user: null,
      session: null,
      error: { message: 'No password provided', status: 401 }
    }
  }

  const bodyData: GenerateLinkBody = {
    email: cred.email,
    type: 'signup',
    redirectTo: options?.redirectTo,
    signUpData: {
      password: cred.password,
      data: options?.data as NewUserInformation
    }
  }

  return fetch('/api/auth_links/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bodyData })
  }).then((res) => res.json())
}

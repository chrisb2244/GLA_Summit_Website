import React, { useContext, useState, createContext, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type {
  Session,
  UserCredentials,
  User,
  PostgrestError
} from '@supabase/supabase-js'
import { ApiError } from '@supabase/supabase-js'
import { ProfileModel, TimezonePreferencesModel } from './databaseModels'
import { myLog } from './utils'
import { GenerateLinkBody } from '@/lib/generateSupabaseLinks'
import { NewUserInformation } from '@/Components/SigninRegistration/NewUserRegistration'

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

// Timezone info - default to client local, allow storing preference in profile
type TimezoneInfo = {
  timeZone: string
  timeZoneName: string
  use24HourClock: boolean
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
const defaultTimezoneInfo = () => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions()
  const timeZoneName = new Date()
    .toLocaleDateString(undefined, { timeZoneName: 'long' })
    .split(',')[1]
    .trim()
  return { timeZone, timeZoneName, use24HourClock: false }
}

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
      body: JSON.stringify({ bodyData })
    })
      .then((res) => {
        if (res.status !== 201) {
          throw new Error(res.statusText)
        }
        return res.json()
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
        // updateSupabaseCookie(ev, session)
      }
    )

    // Cleanup function
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

// ---------------------- Helper functions --------------------------------- //
const getProfileInfo = async (user: User) => {
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

const checkIfOrganizer = async (user: User) => {
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

const queryTimezonePreferences = async (user: User) => {
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

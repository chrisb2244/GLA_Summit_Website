import React, { useContext, useState, createContext, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type {
  Session,
  ApiError,
  UserCredentials,
  User,
  PostgrestError
} from '@supabase/supabase-js'
import { ProfileModel, TimezonePreferencesModel } from './databaseModels'

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
    .substring(12)
  return { timeZone, timeZoneName, use24HourClock: false }
}

export const AuthProvider: React.FC = (props) => {
  const [isLoading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileModel | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [timezoneInfo, setTimezoneInfo] =
    useState<TimezoneInfo>(defaultTimezoneInfo)

  const updateProfileInfo = async () => {
    if (user == null) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from<ProfileModel>('profiles')
      .select('id, firstname, lastname, bio, website, avatar_url')
      .eq('id', user.id)
      .single()

    if (error) {
      setProfile(null)
    }
    if (data) {
      setProfile(data)
    }
  }

  const queryTimezonePreferences = async () => {
    if (user == null) {
      return
    }

    const { data, error } = await supabase
      .from<TimezonePreferencesModel>('timezone_preferences')
      .select()
      .single()
    if (error) {
      return
    }
    const { timezone_db, timezone_name, use_24h_clock } = data
    setTimezoneInfo({
      timeZone: timezone_db,
      timeZoneName: timezone_name,
      use24HourClock: use_24h_clock
    })
  }

  const checkIsOrganizer = async () => {
    if (user == null) {
      return setIsOrganizer(false)
    }
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select()
        .single()
      if (error) throw error
      if (data) {
        console.log('Setting true org!')
        return setIsOrganizer(true)
      }
    } catch (error) {
      const err = error as PostgrestError
      const expected = 'JSON object requested, multiple (or no) rows returned'
      if (err.message === expected) {
        return
      }
      console.log(error)
    }
  }

  const signIn = async (email: string, options?: SignInOptions) => {
    const url = new URL(window.location.href)
    const redirectTo = url.origin + '/'

    return await supabase.auth
      .signIn({ email }, { shouldCreateUser: false, redirectTo, ...options })
      .then(({ session, error, user }) => {
        // if (error === 'AccessDenied') {
        if (error) {
          console.log(error)
          return { error, session: null, user: null }
        }
        setUser(user)
        return { session, user, error }
      })
  }

  const signUp = async (cred: UserCredentials, options?: SignUpOptions) =>
    supabase.auth.signUp(cred, options).then(({ user, session, error }) => {
      if (error) {
        return { user: null, session: null, error }
      }
      // The documentation claims user is valid if no error.
      const validUser = user as User
      return { user: validUser, session, error }
    })

  useEffect(() => {
    updateProfileInfo()
    checkIsOrganizer()
    queryTimezonePreferences()
    setLoading(false)

    const { data: listener } = supabase.auth.onAuthStateChange(
      (ev, session) => {
        console.log(ev)
        setUser(session?.user ?? null)
        setLoading(true)
        updateProfileInfo()
        checkIsOrganizer()
        setLoading(false)
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

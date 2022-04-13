import React, { useContext, useState, createContext, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type {
  Session,
  ApiError,
  UserCredentials,
  User,
  PostgrestError
} from '@supabase/supabase-js'

export type ProfileModel = {
  id: string
  firstname: string
  lastname: string
  bio: string | null
  website: string | null
  avatar_url: string | null
}

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
  session: Session | null
  profile: ProfileModel | null
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
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileModel | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)

  const updateProfileInfo = async () => {
    const user = supabase.auth.user()
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

  const checkIsOrganizer = async () => {
    const user = supabase.auth.user()
    if (user == null) {
      return setIsOrganizer(false)
    }
    try {
      const { data, error } = await supabase.from('organizers').select('*').single()
      if (error) throw error
      if (data) {
        console.log('Setting true org!')
        return setIsOrganizer(true)
      }
    } catch (error) {
      const err = error as PostgrestError
      if (err.message === 'JSON object requested, multiple (or no) rows returned') {
        return
      }
      console.log(error)
    }

  }

  const signIn = async (email: string, options?: SignInOptions) => {
    return await supabase.auth
      .signIn({ email }, { shouldCreateUser: false, ...options })
      .then(({ session, error, user }) => {
        // if (error === 'AccessDenied') {
        if (error) {
          console.log(error)
          return { error, session: null, user: null }
        }
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
    const session = supabase.auth.session()
    setSession(session ?? null)
    updateProfileInfo()
    checkIsOrganizer()
    setLoading(false)

    const { data: listener } = supabase.auth.onAuthStateChange(
      (ev, session) => {
        console.log(ev)
        setLoading(true)
        setSession(session ?? null)
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
    session,
    profile,
    isOrganizer,
    isLoading,
    signIn,
    signUp,
    signOut: async () => await supabase.auth.signOut()
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

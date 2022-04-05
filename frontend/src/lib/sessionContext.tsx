import React, { useContext, useState, createContext, useEffect } from 'react'
import { supabase } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'

type SessionContext = {
  session: Session | null
}

const AuthContext = createContext<SessionContext | undefined>(undefined)

export const AuthProvider: React.FC = (props) => {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const session = supabase.auth.session()
    setSession(session ?? null)
    setLoading(false)

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_ev, session) => {
        setSession(session ?? null)
        setLoading(false)
      }
    )

    // Cleanup function
    return () => {
      listener?.unsubscribe()
    }
  }, [])

  const value: SessionContext = {
    session: session
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && props.children}
    </AuthContext.Provider>
  )
}

// export the useSession hook
export const useSession = () => {
  const context = useContext(AuthContext);
  return context?.session ?? null
};
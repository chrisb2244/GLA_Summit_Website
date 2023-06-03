'use client'
import { useState } from 'react'
import { NewUserRegistration } from './NewUserRegistration'
import { UserSignIn } from './UserSignIn'
import { useSession } from '@/lib/sessionContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { generateSupabaseLinks } from '@/lib/generateSupabaseLinks'

export type RegistrationProps = {
  open?: boolean
  setClosed?: () => void
  initialState?: 'signup' | 'signin'
  waitingSpinner: JSX.Element
}

export const RegistrationPopup: React.FC<React.PropsWithChildren<RegistrationProps>> = (props) => {
  const {
    open = false,
    setClosed = () => {
      return
    },
    initialState = 'signup',
    waitingSpinner
  } = props

  const [state, setState] = useState<'signup' | 'signin'>(initialState)
  // const { signUp, signIn } = useSession()
  const supabase = createClientComponentClient();

  const signUp = () => {}

  // Use the state checks outside of the 'open' property to avoid rendering the unused dialog
  const elemToRender =
    state === 'signup' ? (
      <NewUserRegistration
        open={open}
        setClosed={setClosed}
        signUp={signUp}
        switchToSignIn={() => setState('signin')}
        waitingSpinner={waitingSpinner}
      />
    ) : (
      <UserSignIn
        open={open}
        setClosed={setClosed}
        switchToRegistration={() => setState('signup')}
        waitingSpinner={waitingSpinner}
      />
    )

  return elemToRender
}

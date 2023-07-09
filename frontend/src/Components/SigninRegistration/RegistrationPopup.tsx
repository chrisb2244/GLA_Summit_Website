'use client'
import { useState } from 'react'
import { NewUserRegistration } from './NewUserRegistration'
import { UserSignIn } from './UserSignIn'

export type RegistrationProps = {
  open?: boolean
  setClosed?: () => void
  initialState?: 'signup' | 'signin'
  waitingSpinner: JSX.Element
}

export const RegistrationPopup: React.FC<
  React.PropsWithChildren<RegistrationProps>
> = (props) => {
  const {
    open = false,
    setClosed = () => {
      return
    },
    initialState = 'signup',
    waitingSpinner
  } = props

  const [state, setState] = useState<'signup' | 'signin' | 'validation'>(initialState)
  const [email, setEmail] = useState<string | null>(null)
  const moveToValidation = (email: string) => {
    setEmail(email);
    setState('validation');
  }

  // Use the state checks outside of the 'open' property to avoid rendering the unused dialog
  const elemToRender =
    state === 'signup' ? (
      <NewUserRegistration
        open={open}
        setClosed={setClosed}
        switchToSignIn={() => setState('signin')}
        moveToValidation={moveToValidation}
        waitingSpinner={waitingSpinner}
      />
    ) : state === 'signin' ? (
      <UserSignIn
        open={open}
        setClosed={setClosed}
        switchToRegistration={() => setState('signup')}
        moveToValidation={moveToValidation}
        waitingSpinner={waitingSpinner}
      />
    ) : (
      null
    )

  return elemToRender
}

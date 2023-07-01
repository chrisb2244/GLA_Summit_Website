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

  const [state, setState] = useState<'signup' | 'signin'>(initialState)

  // Use the state checks outside of the 'open' property to avoid rendering the unused dialog
  const elemToRender =
    state === 'signup' ? (
      <NewUserRegistration
        open={open}
        setClosed={setClosed}
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

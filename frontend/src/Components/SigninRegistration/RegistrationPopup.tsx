import { useState } from 'react'
import { NewUserRegistration, SignUpFunction } from './NewUserRegistration'
import { UserSignIn, SignInFunction } from './UserSignIn'

export type RegistrationProps = {
  open?: boolean
  setClosed?: () => void
  signUp: SignUpFunction
  signIn: SignInFunction
  initialState?: 'signup' | 'signin'
  waitingSpinner: JSX.Element
}

export const RegistrationPopup: React.FC<React.PropsWithChildren<RegistrationProps>> = (props) => {
  const {
    open = false,
    setClosed = () => {
      return
    },
    signUp,
    signIn,
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
        signUp={signUp}
        switchToSignIn={() => setState('signin')}
        waitingSpinner={waitingSpinner}
      />
    ) : (
      <UserSignIn
        open={open}
        setClosed={setClosed}
        signIn={signIn}
        switchToRegistration={() => setState('signup')}
        waitingSpinner={waitingSpinner}
      />
    )

  return elemToRender
}

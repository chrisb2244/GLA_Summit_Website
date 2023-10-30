'use client';
import { useState } from 'react';
import { NewUserRegistration } from './NewUserRegistration';
import { UserSignIn } from './UserSignIn';
import { ValidationCodePopup } from './ValidationCodePopup';
import { SignInFormValues } from '../Forms/SignInForm';
import { signIn, signUp } from './SignInUpActions';
import { PersonProps } from '../Form';

export type RegistrationProps = {
  open?: boolean;
  setClosed?: () => void;
  initialState?: 'signup' | 'signin';
  waitingSpinner: JSX.Element;
};

export const RegistrationPopup: React.FC<
  React.PropsWithChildren<RegistrationProps>
> = (props) => {
  const {
    open = false,
    setClosed = () => {
      return;
    },
    initialState = 'signup',
    waitingSpinner
  } = props;

  const [state, setState] = useState<'signup' | 'signin' | 'validation'>(
    initialState
  );
  const [email, setEmail] = useState<string | null>(null);

  const [isWaiting, setIsWaiting] = useState(false);

  const signInSubmitHandler = (data: SignInFormValues) => {
    setIsWaiting(true);
    signIn(data.email)
      .then((success) => {
        if (success) {
          setEmail(data.email);
          setState('validation');
        } else {
          // Probably invalid email for login?
        }
      })
      .finally(() => {
        setIsWaiting(false);
      });
  };

  const signUpSubmitHandler = (data: PersonProps) => {
    setIsWaiting(true);
    signUp(data)
      .then((success) => {
        if (success) {
          setEmail(data.email);
          setState('validation');
        } else {
          // Existing values? Unsure why would fail here.
        }
      })
      .finally(() => {
        setIsWaiting(false);
      });
  };

  // Use the state checks outside of the 'open' property to avoid rendering the unused dialog
  const elemToRender = open ? (
    isWaiting ? (
      waitingSpinner
    ) : state === 'signup' ? (
      <NewUserRegistration
        open={open}
        setClosed={setClosed}
        switchToSignIn={() => setState('signin')}
        onSubmit={signUpSubmitHandler}
      />
    ) : state === 'signin' ? (
      <UserSignIn
        open={open}
        setClosed={setClosed}
        switchToRegistration={() => setState('signup')}
        onSubmit={signInSubmitHandler}
      />
    ) : (
      <ValidationCodePopup
        email={email ?? undefined}
        open={open}
        setClosed={() => {
          setClosed();
        }}
      />
    )
  ) : null;

  return elemToRender;
};

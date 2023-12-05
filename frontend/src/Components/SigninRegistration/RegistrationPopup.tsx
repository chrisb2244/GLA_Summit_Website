'use client';
import { useState } from 'react';
import { NewUserRegistration } from './NewUserRegistration';
import { UserSignIn } from './UserSignIn';
import { ValidationCodePopup } from './ValidationCodePopup';
import { SignInFormValues } from '../Forms/SignInForm';
import { signIn, signUp } from './SignInUpActions';
import { PersonProps } from '../Form/Person';
import { CenteredDialog } from '../Layout/CenteredDialog';

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
  const [email, setEmail] = useState<string | undefined>(undefined);

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
    ) : (
      <CenteredDialog open={open} onClose={setClosed}>
        {state === 'signup' ? (
          <NewUserRegistration
            switchToSignIn={() => setState('signin')}
            onSubmit={signUpSubmitHandler}
          />
        ) : state === 'signin' ? (
          <UserSignIn
            switchToRegistration={() => setState('signup')}
            onSubmit={signInSubmitHandler}
          />
        ) : (
          <ValidationCodePopup email={email} onSubmit={setClosed} />
        )}
      </CenteredDialog>
    )
  ) : null;

  return elemToRender;
};

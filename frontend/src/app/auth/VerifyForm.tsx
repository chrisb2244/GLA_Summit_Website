'use client';
import { Button } from '@/Components/Form/Button';
import { FormField } from '@/Components/Form/FormFieldSrv';
import {
  VerificationState,
  verifyLoginWithRedirectFromForm
} from '@/Components/SigninRegistration/SignInUpActions';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';

type VerifyFormProps = {
  email?: string;
  redirectTo?: string;
};

const ErrorElement = (props: { state: VerificationState }) => {
  const { pending } = useFormStatus();
  if (props.state === null) {
    return null;
  }

  const { success, message } = props.state;
  if (success) {
    return null;
  }
  return (
    <div className='pt-2 text-center text-base'>
      {pending ? (
        <p className='text-gray-400'>Submitting...</p>
      ) : (
        <p className='text-red-500'>{message}</p>
      )}
    </div>
  );
};

export const VerifyForm = (props: VerifyFormProps) => {
  const [lastReturnState, formAction] = useActionState(
    verifyLoginWithRedirectFromForm,
    null
  );

  const { email } = props;
  const hideEmail = typeof email !== 'undefined';
  return (
    <div className='mx-auto flex max-w-lg flex-col py-4'>
      <form action={formAction} aria-label='Verification Code form'>
        <input
          type='hidden'
          name='redirectTo'
          value={props.redirectTo ?? '/'}
        />
        <FormField
          name='email'
          label='Email'
          hidden={hideEmail}
          value={email}
          readOnly={hideEmail}
          autoComplete='email'
          fullWidth
        />
        <FormField
          name='verificationCode'
          type='text'
          required
          label='Verification Code'
          fullWidth
          autoFocus
        />
        <Button type='submit' fullWidth>
          Submit
        </Button>
        <ErrorElement state={lastReturnState} />
      </form>
    </div>
  );
};

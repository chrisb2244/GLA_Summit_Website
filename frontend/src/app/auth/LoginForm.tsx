'use client';

import { FormField } from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import {
  LoginState,
  signInFromFormWithRedirect
} from '@/Components/SigninRegistration/SignInUpActions';
import { buildAuthFormUrl } from '@/Components/SigninRegistration/formState';
import { useFormValidation } from '@/Components/Utilities/useFormValidation';
import { useTouchedFieldErrors } from '@/Components/Utilities/useTouchedFieldErrors';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

const FormError = (props: { message?: string; registerPath: string }) => {
  const { pending } = useFormStatus();

  if (pending || props.message === undefined) {
    return null;
  }

  return (
    <div className='pt-2 text-center text-base text-red-700' role='alert'>
      <p>{props.message}</p>
      {/* The error is the moment a visitor discovers they may be in the wrong
          place, so the route out is offered here rather than only at the top of
          the page. */}
      <p className='pt-1'>
        <Link className='link' href={props.registerPath} replace scroll={false}>
          Create an account
        </Link>
      </p>
    </div>
  );
};

export const LoginForm = (props: { redirectTo?: string; email?: string }) => {
  const initialState: LoginState = {
    errors: undefined,
    data: {
      email: props.email ?? '',
      redirectTo: props.redirectTo
    }
  };
  const [state, formAction] = useActionState(
    signInFromFormWithRedirect,
    initialState
  );
  const { validationMessages, checkValidity } = useFormValidation();
  const { getFieldError, onBlurFor } = useTouchedFieldErrors<'email'>({
    validationMessages,
    fieldErrors: state.errors
  });
  // Mirrors the (uncontrolled) email input so the links across to registration
  // can carry whatever has been typed so far.
  const [typedEmail, setTypedEmail] = useState(state.data.email);
  const registerPath = buildAuthFormUrl('/auth/register', {
    email: typedEmail.trim(),
    redirectTo: props.redirectTo
  });

  return (
    <div className='mx-auto flex max-w-lg flex-col py-4'>
      <div className='prose prose-sm flex max-w-none flex-col items-center px-4 pb-4 text-center'>
        <div className='pb-0.5 prose-p:my-0'>
          <p>
            In order to sign in, enter the email address you used to register
            for this website.
          </p>
          <p>
            Once completed, you will receive an email with a single-use
            verification code.
          </p>
        </div>
        <p>
          <span>{'Not registered?\u00A0'}</span>
          {/* Must use 'replace' here to allow use of router.back() in the dialog form */}
          <Link className='link' href={registerPath} replace scroll={false}>
            Join Now
          </Link>
        </p>
      </div>
      {/* <div className='mx-auto my-4 flex w-full max-w-md flex-col bg-gray-200 px-8 pb-4 pt-6 shadow'> */}
      <form
        aria-label='Login Form'
        action={formAction}
        onChange={(ev) => {
          if (ev.target instanceof HTMLInputElement) {
            if (ev.target.name === 'email') {
              setTypedEmail(ev.target.value);
            }
            checkValidity(ev.target);
          }
        }}
        onInvalidCapture={(ev) => {
          if (ev.target instanceof HTMLInputElement) {
            ev.preventDefault();
            checkValidity(ev.target);
          }
        }}
      >
        <input type='hidden' name='redirectTo' value={props.redirectTo ?? ''} />
        <FormField
          label='Email'
          type='email'
          autoComplete='email'
          placeholder='my.email@glasummit.org'
          id='email'
          defaultValue={state.data.email}
          error={getFieldError('email')}
          required
          fullWidth
          name='email'
          autoFocus
          onBlur={onBlurFor(['email'])}
        />
        <SubmitButton
          fullWidth
          staticText='Log In'
          pendingText='Logging In...'
        />
        <FormError message={state.errors?.form} registerPath={registerPath} />
      </form>
      {/* </div> */}
    </div>
  );
};

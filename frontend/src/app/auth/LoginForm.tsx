"use client";

import { FormField } from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import {
  LoginState,
  signInFromFormWithRedirect
} from '@/Components/SigninRegistration/SignInUpActions';
import { useFormValidation } from '@/Components/Utilities/useFormValidation';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const FormError = (props: { message?: string }) => {
  const { pending } = useFormStatus();

  if (pending || props.message === undefined) {
    return null;
  }

  return (
    <p className='pt-2 text-center text-base text-red-700' role='alert'>
      {props.message}
    </p>
  );
};

export const LoginForm = (props: { redirectTo?: string }) => {
  const registerPath = props.redirectTo
    ? `/auth/register?redirectTo=${props.redirectTo}`
    : '/auth/register';
  const initialState: LoginState = {
    errors: undefined,
    data: {
      email: '',
      redirectTo: props.redirectTo
    }
  };
  const [state, formAction] = useActionState(signInFromFormWithRedirect, initialState);
  const { validationMessages, checkValidity } = useFormValidation();

  const fieldError = () => {
    return validationMessages.get('email') ?? state.errors?.email;
  };

  return (
    <div
      className='mx-auto flex max-w-lg flex-col py-4'
      role='form'
      aria-label='Login Form'
    >
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
        action={formAction}
        onChange={(ev) => {
          if (ev.target instanceof HTMLInputElement) {
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
          error={fieldError()}
          required
          fullWidth
          name='email'
          autoFocus
        />
        <SubmitButton
          fullWidth
          staticText='Log In'
          pendingText='Logging In...'
        />
        <FormError message={state.errors?.form} />
      </form>
      {/* </div> */}
    </div>
  );
};

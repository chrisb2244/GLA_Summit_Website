'use client';

import { Person, PersonProps } from '@/Components/Form/PersonSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import {
  registerFromFormWithRedirect,
  RegistrationState
} from '@/Components/SigninRegistration/SignInUpActions';
import { useFormValidation } from '@/Components/Utilities/useFormValidation';
import { useTouchedFieldErrors } from '@/Components/Utilities/useTouchedFieldErrors';
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

export const RegistrationForm = (props: { redirectTo?: string }) => {
  const loginPath = props.redirectTo
    ? `/auth/login?redirectTo=${props.redirectTo}`
    : '/auth/login';
  const initialState: RegistrationState = {
    errors: undefined,
    data: {
      firstName: '',
      lastName: '',
      email: '',
      redirectTo: props.redirectTo
    }
  };
  const [state, formAction] = useActionState(
    registerFromFormWithRedirect,
    initialState
  );
  const { validationMessages, checkValidity } = useFormValidation();
  const { getFieldError, onBlurFor } = useTouchedFieldErrors<keyof PersonProps>(
    {
      validationMessages,
      fieldErrors: state.errors
    }
  );

  return (
    <div className='mx-auto flex max-w-lg flex-col py-4'>
      <div className='prose prose-sm flex w-full flex-col items-center space-y-2 px-2 pb-4 text-center'>
        <div className='flex flex-col pb-4'>
          <span>Already registered? </span>
          {/* Must use 'replace' here to allow use of router.back() in the dialog form */}
          <Link className='link' href={loginPath} replace scroll={false}>
            Sign In
          </Link>
          <span className='prose-sm'>
            Accounts created in previous years can still be used!
          </span>
        </div>

        <p>
          Please fill out the information below. You will receive an email with
          a verification token - enter this token on the next page to complete
          your registration.
        </p>
        {/* <div className='my-2 rounded-sm bg-red-600 py-2 text-white'>
          <span>
            In order to attend the conference, the required registration can be
            found at{' '}
          </span>
          <a href={'https://hopin.com/events/gla-summit-2022'} className='link'>
            https://hopin.com/events/gla-summit-2022
          </a>
        </div> */}
        {/* <p>
          This site is currently mostly focused on presentation submission,
          although the presentations from previous years can be found at{' '}
          {
            <Link href={'/presentation-list'}>
              <span className='link'>https://glasummit.org/presentations</span>
            </Link>
          }
          .
        </p> */}
      </div>
      <form
        aria-label='Registration Form'
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
        onBlur={onBlurFor(['firstName', 'lastName', 'email'])}
      >
        <input type='hidden' name='redirectTo' value={props.redirectTo ?? ''} />
        <div className='pb-4'>
          <Person<PersonProps>
            splitSize={'md'}
            giveFocus
            defaultValue={state.data}
            errors={{
              firstName: getFieldError('firstName'),
              lastName: getFieldError('lastName'),
              email: getFieldError('email')
            }}
          />
        </div>
        <SubmitButton
          fullWidth
          staticText='Register'
          pendingText='Registering...'
        />
        <FormError message={state.errors?.form} />
      </form>
    </div>
  );
};

import { FormField } from '@/Components/Form/FormFieldSrv';
import { SubmitButton } from '@/Components/Form/SubmitButton';
import { signInFromFormWithRedirect } from '@/Components/SigninRegistration/SignInUpActions';
import Link from 'next/link';

export const LoginForm = (props: { redirectTo?: string }) => {
  const registerPath = props.redirectTo
    ? `/auth/register?redirectTo=${props.redirectTo}`
    : '/auth/register';

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
      <form action={signInFromFormWithRedirect}>
        <input type='hidden' name='redirectTo' value={props.redirectTo} />
        <FormField
          label='Email'
          type='email'
          autoComplete='email'
          placeholder='my.email@glasummit.org'
          id='email'
          fullWidth
          name='email'
          autoFocus
        />
        <SubmitButton
          fullWidth
          staticText='Log In'
          pendingText='Logging In...'
        />
      </form>
      {/* </div> */}
    </div>
  );
};

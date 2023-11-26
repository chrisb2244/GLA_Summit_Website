import { Button } from '@/Components/Form/Button';
import { Person, PersonProps } from '@/Components/Form/PersonSrv';
import { registerFromFormWithRedirect } from '@/Components/SigninRegistration/SignInUpActions';
import Link from 'next/link';

export const RegistrationForm = (props: { redirectTo?: string }) => {
  const loginPath = props.redirectTo
    ? `/auth/login?redirectTo=${props.redirectTo}`
    : '/auth/login';

  return (
    <div className='mx-auto flex max-w-lg flex-col py-4'>
      <div className='prose prose-sm flex w-full flex-col items-center space-y-2 px-2 pb-4 text-center'>
        <div>
          <span>Already registered? </span>
          <Link className='link' href={loginPath}>
            Sign In
          </Link>
        </div>
        <p>
          Please fill out the information below. You will receive an email with
          a verification token - enter this token on the next page to complete
          your registration.
        </p>
        {/* <div className='my-2 rounded bg-red-600 py-2 text-white'>
          <span>
            In order to attend the conference, the required registration can be
            found at{' '}
          </span>
          <a href={'https://hopin.com/events/gla-summit-2022'} className='link'>
            https://hopin.com/events/gla-summit-2022
          </a>
        </div> */}
        <p>
          This site is currently mostly focused on presentation submission,
          although the presentations from previous years can be found at{' '}
          {
            <Link href={'/presentation-list'}>
              <span className='link'>https://glasummit.org/presentations</span>
            </Link>
          }
          .
        </p>
      </div>
      <form action={registerFromFormWithRedirect}>
        <input type='hidden' name='redirectTo' value={props.redirectTo} />
        <div className='pb-4'>
          <Person<PersonProps> splitSize={'md'} />
        </div>
        <Button type='submit' fullWidth>
          Register
        </Button>
      </form>
    </div>
  );
};

import type { SignInOptions, SignInReturn } from '@/lib/sessionTypes';
import { SignInForm, SignInFormValues } from '../Forms/SignInForm';
import { SubmitHandler } from 'react-hook-form';

type SignInProps = {
  switchToRegistration: () => void;
  onSubmit: SubmitHandler<SignInFormValues>;
};

export type SignInFunction = (
  email: string,
  options?: SignInOptions | undefined
) => Promise<SignInReturn>;

export const UserSignIn = (props: SignInProps) => {
  const { switchToRegistration, onSubmit } = props;

  return (
    <>
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
          <button className='link' onClick={switchToRegistration}>
            Join Now
          </button>
        </p>
      </div>
      <SignInForm onSubmit={onSubmit} />
    </>
  );
};

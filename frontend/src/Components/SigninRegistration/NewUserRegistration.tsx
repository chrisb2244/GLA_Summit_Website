import type { SubmitHandler } from 'react-hook-form';
import { PersonProps } from '../Form/Person';
import NextLink from 'next/link';
import { CenteredDialog } from '../Layout/CenteredDialog';
import { SignUpForm } from '../Forms/SignUpForm';

type UserRegistrationProps = {
  open: boolean;
  setClosed: () => void;
  switchToSignIn: () => void;
  onSubmit: SubmitHandler<PersonProps>;
};

export type NewUserInformation = {
  firstname: string;
  lastname: string;
};

export const NewUserRegistration: React.FC<
  React.PropsWithChildren<UserRegistrationProps>
> = ({ open, setClosed, ...props }) => {
  return (
    <CenteredDialog
      open={open}
      onClose={() => {
        setClosed();
      }}
      dialogId='registerDialog'
    >
      <div className='prose-sm prose flex flex-col items-center space-y-2 px-2 pb-4 text-center'>
        <div>
          <span>Already registered? </span>
          <a
            className='link'
            onClick={(ev) => {
              ev.preventDefault();
              props.switchToSignIn();
            }}
          >
            Sign In
          </a>
        </div>
        <p>
          Please fill out the information below. You will receive an email with
          a verification link - click the link to automatically sign into the
          site.
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
          although last year&apos;s presentations can be found at{' '}
          {
            <NextLink href={'/presentation-list'}>
              <span className='link'>
                https://glasummit.org/presentations
              </span>
            </NextLink>
          }
          .
        </p>
      </div>
      <SignUpForm onSubmit={props.onSubmit} />
    </CenteredDialog>
  );
};

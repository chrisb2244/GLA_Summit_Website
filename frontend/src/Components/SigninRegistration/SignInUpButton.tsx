'use client';
import { useState } from 'react';
import { RegistrationPopup } from './RegistrationPopup';
import { usePathname, useRouter } from 'next/navigation';

type SignInUpButtonProps = {
  waitingSpinner: JSX.Element;
};

export const SignInUpButton: React.FC<SignInUpButtonProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { waitingSpinner } = props;
  const router = useRouter();
  const pathName = usePathname();
  const appendedRedirect = pathName !== '/' ? `?redirectTo=${pathName}` : '';

  return (
    <>
      <button
        className='flex h-full px-2 hover:bg-secondaryc'
        onClick={() => {
          // setDialogOpen(true);
          router.push(`/auth/login${appendedRedirect}`);
        }}
      >
        <span className='prose prose-lg p-2 text-white '>
          Sign In / Register
        </span>
      </button>
      <RegistrationPopup
        open={dialogOpen}
        setClosed={() => {
          setDialogOpen(false);
        }}
        waitingSpinner={waitingSpinner}
      />
    </>
  );
};

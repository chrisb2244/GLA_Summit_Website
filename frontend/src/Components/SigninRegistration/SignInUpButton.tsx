'use client';
import { useState } from 'react';
import { RegistrationPopup } from './RegistrationPopup';
import { useRouter } from 'next/navigation';

type SignInUpButtonProps = {
  waitingSpinner: JSX.Element;
};

export const SignInUpButton: React.FC<SignInUpButtonProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { waitingSpinner } = props;
  const router = useRouter();

  return (
    <>
      <button
        className='flex h-full px-2 hover:bg-secondaryc'
        onClick={() => {
          // setDialogOpen(true);
          router.push('/auth/login');
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

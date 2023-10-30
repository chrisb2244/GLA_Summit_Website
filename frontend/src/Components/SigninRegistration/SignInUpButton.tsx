'use client';
import { useState } from 'react';
import { RegistrationPopup } from './RegistrationPopup';

type SignInUpButtonProps = {
  waitingSpinner: JSX.Element;
};

export const SignInUpButton: React.FC<SignInUpButtonProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { waitingSpinner } = props;

  return (
    <>
      <button
        className='flex h-full px-2 hover:bg-secondaryc'
        onClick={() => {
          setDialogOpen(true);
        }}
      >
        <span className='prose-lg prose p-2 text-white '>
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

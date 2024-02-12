'use client';
import { Dialog } from '@headlessui/react';
import React, { type PropsWithChildren } from 'react';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  dialogId?: string;
};

export const CenteredDialog: React.FC<PropsWithChildren<DialogProps>> = (
  props
) => {
  const { open, onClose, dialogId, children } = props;

  return (
    <Dialog className='relative z-[100]' open={open} onClose={onClose}>
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className='fixed inset-0 bg-black/30' aria-hidden='true' />

      {/* Full-screen container to center the panel */}
      <div className='fixed inset-0 flex w-screen items-center justify-center p-4'>
        <Dialog.Panel
          className='mx-auto max-w-xl rounded bg-white p-4'
          id={dialogId}
        >
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

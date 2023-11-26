'use client';

import { CenteredDialog } from '@/Components/CenteredDialog';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { VerifyForm } from 'src/app/auth/validateLogin/VerifyForm';

const ValidateModalPage = () => {
  const pathname = usePathname();
  const email = useSearchParams()?.get('email') ?? undefined;
  const router = useRouter();

  return (
    <CenteredDialog
      open={pathname === '/auth/validateLogin'}
      onClose={() => {
        router.replace('/');
      }}
    >
      <VerifyForm email={email} />
    </CenteredDialog>
  );
};

export default ValidateModalPage;

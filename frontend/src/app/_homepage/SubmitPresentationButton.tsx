import { Button } from '@/Components/Form/Button';
import { PulsedButton } from '@/Components/Form/PulsedButton';
import { getUser } from '@/lib/supabase/userFunctions';
import Link from 'next/link';
import React, { Suspense } from 'react';

const CheckedLink = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUser();
  const loggedIn = user !== null;

  const submitPresentationButton = (
    <Link
      href={
        loggedIn
          ? '/my-presentations'
          : '/auth/register?redirectTo=/my-presentations'
      }
      prefetch={loggedIn}
      scroll={loggedIn}
    >
      {children}
    </Link>
  );

  return submitPresentationButton;
};

const FallbackLink = ({ children }: { children: React.ReactNode }) => {
  return (
    <Link
      href={'/auth/register?redirectTo=/my-presentations'}
      prefetch={false}
      scroll={false}
    >
      {children}
    </Link>
  );
};

export const SubmitPresentationButton = ({
  children
}: {
  children: React.ReactNode;
}) => (
  <Suspense fallback={<FallbackLink>{children}</FallbackLink>}>
    <CheckedLink>{children}</CheckedLink>
  </Suspense>
);

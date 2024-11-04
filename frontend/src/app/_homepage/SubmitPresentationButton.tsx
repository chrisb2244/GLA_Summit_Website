import { PulsedButton } from '@/Components/Form/PulsedButton';
import { getUser } from '@/lib/supabase/userFunctions';
import Link from 'next/link';
import { Suspense } from 'react';

type Props = {
  children: React.ReactNode;
};

const CheckedLink = async ({ children }: Props) => {
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

const FallbackLink = ({ children }: Props) => {
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

const buttonElement = (
  <PulsedButton fullWidth>Submit a Presentation</PulsedButton>
);

export const SubmitPresentationButton = () => (
  <Suspense fallback={<FallbackLink>{buttonElement}</FallbackLink>}>
    <CheckedLink>{buttonElement}</CheckedLink>
  </Suspense>
);

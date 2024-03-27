import { Button } from '@/Components/Form/Button';
import { createServerComponentClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Suspense } from 'react';

const SubmitPresentationButtonWithCheck = async () => {
  const supabase = createServerComponentClient();
  const user = (await supabase.auth.getUser())?.data?.user ?? undefined;
  const loggedIn = typeof user !== 'undefined';

  const submitPresentationButton = (
    <Link
      href={
        loggedIn
          ? '/my-presentations'
          : '/auth/register?redirectTo=/my-presentations'
      }
      prefetch={false}
      scroll={loggedIn}
    >
      <Button fullWidth>Submit a Presentation</Button>
    </Link>
  );

  return submitPresentationButton;
};

const SubmitPresentationButtonFallback = () => {
  return (
    <Link
      href={'/auth/register?redirectTo=/my-presentations'}
      prefetch={false}
      scroll={false}
    >
      <Button fullWidth>Submit a Presentation</Button>
    </Link>
  );
};

export const SubmitPresentationButton = () => (
  <Suspense fallback={<SubmitPresentationButtonFallback />}>
    {SubmitPresentationButtonWithCheck()}
  </Suspense>
);

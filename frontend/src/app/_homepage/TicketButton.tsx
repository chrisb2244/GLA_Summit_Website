import { Button } from '@/Components/Form/Button';
import { createServerComponentClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { Suspense } from 'react';

const TicketButtonWithCheck = async () => {
  const supabase = createServerComponentClient();
  const user = (await supabase.auth.getUser())?.data?.user ?? undefined;
  const loggedIn = typeof user !== 'undefined';

  const ticketButton = (
    <Link
      href={loggedIn ? '/ticket' : '/auth/register?redirectTo=/ticket'}
      prefetch={false}
      scroll={loggedIn}
    >
      <Button fullWidth>Get Your Ticket</Button>
    </Link>
  );

  return ticketButton;
};

const TicketButtonFallback = () => {
  return (
    <Link
      href={'/auth/register?redirectTo=/ticket'}
      prefetch={false}
      scroll={false}
    >
      <Button fullWidth>Get Your Ticket</Button>
    </Link>
  );
};

export const TicketButton = () => (
  <Suspense fallback={<TicketButtonFallback />}>
    {TicketButtonWithCheck()}
  </Suspense>
);

import { redirect, RedirectType } from 'next/navigation';
import { after } from 'next/server';
import { ticketYear } from '@/app/configConstants';
import { createServerClient } from '@/lib/supabaseServer';
import { ticketDataAndTokenToPageUrl } from './utils';
import { createHmac } from 'node:crypto';
import { logToDb } from '@/lib/utils';
import { getUser } from '@/lib/supabase/userFunctions';
import { Suspense } from 'react';

export type TicketData = {
  firstName: string;
  lastName: string;
  ticketNumber: number;
  isPresenter: boolean;
  userId: string;
};

export type TransferObject = {
  data: TicketData;
  token: string;
};

const TICKET_KEY = process.env.TICKET_KEY as string;

const getToken = (jsonString: string) => {
  const hmac = createHmac('sha256', TICKET_KEY);
  hmac.update(jsonString);
  return hmac.digest('hex');
};

const TicketGeneratorPage = () => {
  return (
    <Suspense fallback={<p>Loading ticket...</p>}>
      <TicketGeneratorPageContent />
    </Suspense>
  );
};

const TicketGeneratorPageContent = async () => {
  const user = await getUser();
  if (user === null) {
    redirect('/auth/login?redirectTo=/ticket', RedirectType.replace);
  }
  const userId = user.id;

  const supabase = await createServerClient();

  const ticketRpc = supabase
    .rpc('get_or_create_ticket', { p_year: ticketYear })
    .single();

  // The second element of the presenterResult array is the list of titles.
  // It can be used if they should be written on the ticket, but at present it
  // was determined that was too long/verbose.
  const [ticketResult, presenterResult, profileResult] = await Promise.all([
    ticketRpc,
    supabase
      .from('presentation_submissions')
      .select(
        'title, presentation_presenters!inner(presenter_id), accepted_presentations!inner(year)'
      )
      .eq('accepted_presentations.year', ticketYear)
      .eq('presentation_presenters.presenter_id', userId),
    supabase
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', userId)
      .single()
  ]);

  const { data: ticket, error: ticketError } = ticketResult;

  if (!ticket) {
    after(() =>
      logToDb('error', 'Failed to get or create ticket', 'ticket/issue', {
        userId,
        context: {
          message: ticketError?.message,
          code: ticketError?.code,
          details: ticketError?.details
        }
      })
    );
    return (
      <div className='prose mx-auto mt-4 text-center'>
        <p>Failed to create a new ticket</p>
        <p>
          Refreshing the page may fix this issue - if it does not, please
          contact web@glasummit.org
        </p>
      </div>
    );
  }

  const { data: profile, error: profileError } = profileResult;
  if (!profile) {
    after(() =>
      logToDb('error', 'Failed to fetch profile for ticket', 'ticket/issue', {
        userId,
        context: {
          ticketNumber: ticket.ticket_number,
          message: profileError?.message
        }
      })
    );
    return (
      <div className='prose mx-auto mt-4 text-center'>
        <p>Failed to load profile</p>
        <p>
          Refreshing the page may fix this issue - if it does not, please
          contact web@glasummit.org
        </p>
      </div>
    );
  }

  const [isPresenter]: [true, string[]] | [false, null] = (() => {
    const { data, error } = presenterResult;
    if (error) return [false, null];
    if (data && data.length > 0) return [true, data.map((d) => d.title)];
    return [false, null];
  })();

  const ticketObject: TicketData = {
    firstName: profile.firstname,
    lastName: profile.lastname,
    ticketNumber: ticket.ticket_number,
    isPresenter,
    userId
  };

  const transferObject: TransferObject = {
    data: ticketObject,
    token: getToken(JSON.stringify(ticketObject))
  };

  after(() =>
    logToDb('info', 'Ticket issued', 'ticket/issue', {
      userId,
      context: { ticketNumber: ticket.ticket_number }
    })
  );

  redirect(ticketDataAndTokenToPageUrl(transferObject));
};

export default TicketGeneratorPage;

import { redirect, RedirectType } from 'next/navigation';
import { ticketYear } from '@/app/configConstants';
import { createServerClient } from '@/lib/supabaseServer';
import { ticketDataAndTokenToPageUrl } from './utils';
import { createHmac } from 'node:crypto';
import { logErrorToDb } from '@/lib/utils';
import { getUser } from '@/lib/supabase/userFunctions';

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
export const dynamic = 'force-dynamic';

const getToken = (jsonString: string) => {
  const hmac = createHmac('sha256', TICKET_KEY);
  hmac.update(jsonString);
  const token = hmac.digest('hex');
  return token;
};

const TicketGeneratorPage = async () => {
  const user = await getUser();
  if (user === null) {
    redirect('/auth/login?redirectTo=/ticket', RedirectType.replace);
  }
  const userId = user.id;

  const supabase = await createServerClient();
  const fetchExistingTicket = async () => {
    return await supabase
      .from('tickets')
      .select('*,profiles(firstname, lastname)')
      .eq('user_id', userId)
      .eq('year', ticketYear)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return null;
        }
        return data;
      });
  };

  const existingTicket = await fetchExistingTicket();

  // The second element of the array here is the list of titles
  // This can be used if they should be written on the ticket,
  // but at present it was determined that was too long/verbose.
  const [isPresenter]: [true, string[]] | [false, null] = await supabase
    .from('presentation_submissions')
    .select(
      'title, presentation_presenters!inner(presenter_id), accepted_presentations!inner(year)'
    )
    .eq('accepted_presentations.year', ticketYear)
    .eq('presentation_presenters.presenter_id', userId)
    .then(({ data, error }) => {
      if (error) {
        console.error(error);
        return [false, null];
      }
      if (data.length > 0) {
        return [true, data.map((d) => d.title)];
      }
      return [false, null];
    });

  if (existingTicket) {
    const ticketObject: TicketData = {
      // The profile is linked as a foreign key, so it should always exist
      // Firstname and lastname are required on registration
      firstName: existingTicket.profiles?.firstname ?? '',
      lastName: existingTicket.profiles?.lastname ?? '',
      ticketNumber: existingTicket.ticket_number,
      isPresenter,
      userId: user.id
    };
    const transferObject: TransferObject = {
      data: ticketObject,
      token: getToken(JSON.stringify(ticketObject))
    };

    logErrorToDb(
      `Fetched an existing ticket: ${existingTicket.ticket_number} (${
        user.email ?? 'no email'
      })`,
      'info',
      userId
    );

    redirect(ticketDataAndTokenToPageUrl(transferObject));
  } else {
    // Create a ticket
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        year: ticketYear
      })
      .select()
      .single();

    logErrorToDb(
      `New Ticket request: ${JSON.stringify({ newTicket, error })} (${
        user.email ?? 'no email'
      })`,
      'info',
      userId
    );
    // console.log({ newTicket, error, time: new Date().toISOString() });

    if (!newTicket) {
      console.error('Failed to create a new ticket');
      logErrorToDb(
        `Failed to create a new ticket: ${error?.message}, (${error?.details}) (${error?.code})`,
        'error',
        userId
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

    const profile = await supabase
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return null;
        }
        return data;
      });

    if (!profile) {
      console.error('Failed to get profile');
      return <div>Failed to get profile</div>;
    }

    const ticketObject: TicketData = {
      firstName: profile.firstname,
      lastName: profile.lastname,
      ticketNumber: newTicket.ticket_number,
      isPresenter,
      userId: user.id
    };

    logErrorToDb(
      `Created a new ticket: ${newTicket.ticket_number}`,
      'info',
      userId
    );

    const transferObject: TransferObject = {
      data: ticketObject,
      token: getToken(JSON.stringify(ticketObject))
    };

    const redirectPath = ticketDataAndTokenToPageUrl(transferObject);
    // console.log({
    //   transferObject,
    //   redirectPath,
    //   time: new Date().toISOString()
    // });

    redirect(redirectPath);
  }
};

export default TicketGeneratorPage;

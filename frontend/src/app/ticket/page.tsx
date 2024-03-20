import { redirect, RedirectType } from 'next/navigation';
import { ticketYear } from '../api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { ticketDataAndTokenToPageUrl } from './utils';
import { createHmac } from 'node:crypto';
import { logErrorToDb } from '@/lib/utils';

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
  const supabase = createServerComponentClient();
  const user = await supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.error(error);
      return null;
    }
    return data.user;
  });

  if (user === null) {
    redirect('/auth/login?redirectTo=/ticket', RedirectType.replace);
  }
  const userId = user.id;

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

  const [isPresenter, _]: [true, string[]] | [false, null] = await supabase
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

    redirect(ticketDataAndTokenToPageUrl(transferObject));
  } else {
    // Create a ticket
    const { error } = await supabase.from('tickets').insert({
      user_id: userId,
      year: ticketYear
    });
    if (error) {
      console.error(error);
    }

    const newTicket = await fetchExistingTicket();

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

    const transferObject: TransferObject = {
      data: ticketObject,
      token: getToken(JSON.stringify(ticketObject))
    };

    redirect(ticketDataAndTokenToPageUrl(transferObject));
  }
};

export default TicketGeneratorPage;

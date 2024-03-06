import { redirect, RedirectType } from 'next/navigation';
import { ticketYear } from '../api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { ticketDataAndTokenToPageUrl } from './utils';
import { createHmac } from 'node:crypto';

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

  if (!user) {
    redirect('/auth/login?redirectTo=/ticket', RedirectType.replace);
  }
  const userId = user.id;

  const existingTicket = await supabase
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
    const newTicket = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        year: ticketYear
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return null;
        }
        return data;
      });

    if (!newTicket) {
      console.error('Failed to create a new ticket');
      return <div>Failed to create a new ticket</div>;
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

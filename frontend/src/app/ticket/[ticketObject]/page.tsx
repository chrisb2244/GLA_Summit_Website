import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH } from '@/app/api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { paramStringToData, urlEncodedB64DataFromObject } from '../utils';
import { createHmac } from 'node:crypto';
import Link from 'next/link';
const TICKET_KEY = process.env.TICKET_KEY as string;

const getToken = (data: string) => {
  const hmac = createHmac('sha256', TICKET_KEY);
  hmac.update(data);
  const token = hmac.digest('hex');
  return token;
};

const ticketDataToRouteUrl = (ticketObject: TicketData, prefix?: string) => {
  const b64Data = urlEncodedB64DataFromObject(ticketObject);
  const token = getToken(b64Data);
  const calculatedString = `/api/ticket?token=${token}&data=${b64Data}`;
  if (prefix) {
    return new URL(calculatedString, prefix).href;
  }
  return calculatedString;
};

type PageProps = {
  params: {
    ticketObject: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export type TicketData = {
  firstName: string;
  lastName: string;
  ticketNumber: number;
  isPresenter: boolean;
  userId: string;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { ticketObject } = params;

  const ticketObj = paramStringToData(ticketObject);
  if (!ticketObj) {
    // Invalid object, don't add to metadata
    return {};
  }

  // The Environment that the app is deployed and running on.
  // The value can be either production, preview, or development.
  const environment = process.env.VERCEL_ENV || 'development';

  // VERCEL_URL : The domain name of the generated deployment URL.
  // Example: *.vercel.app.
  // The value does not include the protocol scheme https://.
  const prefix =
    environment === 'preview'
      ? 'https://' + process.env.VERCEL_URL
      : 'https://glasummit.org';

  const ogImageUrl = ticketDataToRouteUrl(ticketObj, prefix);

  return {
    title: 'Ticket',
    openGraph: {
      title: 'My GLA Summit Ticket',
      description:
        "I've got my ticket for the GLA Summit 2024!\r\nGet yours at https://glasummit.org/ticket",
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: IMG_WIDTH,
          height: IMG_HEIGHT,
          alt: 'GLA Summit Ticket image'
        }
      ]
    }
  };
}

const TicketPage: NextPage<PageProps> = async ({
  params: { ticketObject: ticketObjectString },
  searchParams: { share }
}) => {
  // Display different page if viewing someone else's shared ticket view.
  const supabase = createServerComponentClient();
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user?.id;

  const ticketObject = paramStringToData(ticketObjectString);
  const isSharedPage =
    share === 'true' || !userId || ticketObject?.userId !== userId;

  if (!ticketObject) {
    return (
      <div>
        <h3>Invalid ticket data.</h3>
      </div>
    );
  }
  const nameString = [ticketObject.firstName, ticketObject.lastName].join(' ');

  // Get the URL for the ticket image
  // This does not depend on sharing, it is the same for any viewer
  const urlString = ticketDataToRouteUrl(ticketObject);

  const showIcs = false;
  const icsElem = showIcs ? (
    <p>
      <a href='/api/ics' target='_blank' rel='noreferrer' className='link'>
        Click here for a calendar ICS file
      </a>
    </p>
  ) : null;

  return (
    <div className='mx-auto my-2 flex flex-col items-center text-xl'>
      <img
        src={urlString}
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        className='mx-auto my-4 max-w-full md:max-w-screen-md'
      />
      {isSharedPage ? (
        <h3>
          This is {nameString}&apos;s ticket - get your own{' '}
          <Link href='/ticket'>
            <span className='link'>here</span>
          </Link>
          !
        </h3>
      ) : (
        <div className='flex flex-col items-center'>
          <h3>You&apos;re all set to go!</h3>
          <p>We can&apos;t wait to see you on the 24th and 25th March</p>
          {icsElem}
        </div>
      )}
    </div>
  );
};

export default TicketPage;

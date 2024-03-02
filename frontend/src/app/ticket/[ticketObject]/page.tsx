import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH } from '@/app/api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { paramStringToData, urlEncodedB64DataFromObject } from '../utils';
import { createHmac } from 'node:crypto';
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

  return (
    <div>
      {isSharedPage ? (
        <h3>Here&apos;s {nameString}&apos;s ticket!</h3>
      ) : (
        <h3>You&apos;re all set to go!</h3>
      )}
      <img
        src={urlString}
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        className='mx-auto my-4 max-w-full md:max-w-screen-md'
      />
    </div>
  );
};

export default TicketPage;

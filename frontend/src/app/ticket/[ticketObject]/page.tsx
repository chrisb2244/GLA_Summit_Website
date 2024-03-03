import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH, ticketYear } from '@/app/api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import {
  paramStringToData,
  ticketDataToPageUrl,
  urlEncodedB64DataFromObject
} from '../utils';
import { createHmac } from 'node:crypto';
import Link from 'next/link';
import { Button } from '@/Components/Form/Button';
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

const getPrefix = () => {
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
  return prefix;
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

  const ogImageUrl = ticketDataToRouteUrl(ticketObj, getPrefix());

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
    },
    twitter: {
      card: 'summary',
      site: '@GlaSummit',
      title: 'My GLA Summit Ticket',
      description:
        "I've got my ticket for the GLA Summit 2024!\r\nGet yours at https://glasummit.org/ticket",
      images: [
        {
          url: ogImageUrl,
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

  // Sharing elements
  const fixedEncodeURI = (str: string) => {
    return encodeURI(str).replace(
      /[!'()*]/g,
      (c) => '%' + c.charCodeAt(0).toString(16)
    );
  };

  const thisPageUrl = fixedEncodeURI(
    ticketDataToPageUrl(ticketObject, getPrefix())
  );
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${thisPageUrl}`;

  const twitterMessage = `I've got my ticket for the GLA Summit ${ticketYear}! Get yours at https://glasummit.org/ticket`;
  const twitterShareUrl = new URL('https://twitter.com/intent/tweet');
  twitterShareUrl.searchParams.set('url', thisPageUrl);
  twitterShareUrl.searchParams.set('via', 'GlaSummit');
  twitterShareUrl.searchParams.set('text', twitterMessage);

  const shareElements = (
    <div className='my-auto flex flex-col items-center space-y-2 pt-2 min-[350px]:flex-row min-[350px]:space-x-4 min-[350px]:space-y-0'>
      <a href={linkedInShareUrl} className='link' target='_blank'>
        <Button>Share to LinkedIn</Button>
      </a>
      <a href={twitterShareUrl.href} className='link' target='_blank'>
        <Button>Share to X</Button>
      </a>
    </div>
  );

  return (
    <div className='mx-auto my-2 flex flex-col items-center text-xl'>
      <img
        src={urlString}
        width={IMG_WIDTH}
        height={IMG_HEIGHT}
        className='md:max-w-screen-[800px] mx-auto my-4 max-w-full'
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
          {shareElements}
        </div>
      )}
    </div>
  );
};

export default TicketPage;

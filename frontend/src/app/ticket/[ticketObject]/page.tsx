import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH, ticketYear } from '@/app/api/ticket/constants';
import { createServerComponentClient } from '@/lib/supabaseServer';
import {
  fixedEncodeURI,
  paramStringToData,
  ticketDataAndTokenToPageUrl
} from '../utils';
import type { TransferObject } from '../page';
import Link from 'next/link';
import { Button } from '@/Components/Form/Button';
import { Suspense } from 'react';
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator';
import Image from 'next/image';

type PageProps = {
  params: {
    ticketObject: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
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
      : environment === 'development'
      ? 'http://localhost:3000'
      : 'https://glasummit.org';
  return prefix;
};

const ticketDataToRouteUrl = (obj: TransferObject, prefix?: string) => {
  const b64Data = Buffer.from(JSON.stringify(obj)).toString('base64url');
  if (prefix) {
    const url = new URL('/api/ticket', prefix);
    url.searchParams.set('data', b64Data);
    return url.href;
  } else {
    return `/api/ticket?data=${encodeURIComponent(b64Data)}`;
  }
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
  params: { ticketObject: transferObjectString },
  searchParams: { share }
}) => {
  // Display different page if viewing someone else's shared ticket view.
  const supabase = createServerComponentClient();
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user?.id;

  const transferObject = paramStringToData(transferObjectString);
  const isSharedPage =
    share === 'true' || !userId || transferObject?.data.userId !== userId;

  if (!transferObject) {
    return (
      <div>
        <h3>Invalid ticket data.</h3>
      </div>
    );
  }
  const nameString = [
    transferObject.data.firstName,
    transferObject.data.lastName
  ].join(' ');

  // Get the URL for the ticket image
  // This does not depend on sharing, it is the same for any viewer
  const urlString = ticketDataToRouteUrl(transferObject);

  const showIcs = false;
  const icsElem = showIcs ? (
    <p>
      <a href='/api/ics' target='_blank' rel='noreferrer' className='link'>
        Click here for a calendar ICS file
      </a>
    </p>
  ) : null;

  // Sharing elements

  const thisPageUrl = ticketDataAndTokenToPageUrl(transferObject, getPrefix());

  // Use the encoding here, string parsing only (so no double-encoding).
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${thisPageUrl}`;

  const twitterMessage = `I've got my ticket for the GLA Summit ${ticketYear}! Get yours at https://glasummit.org/ticket`;
  const twitterShareUrl = new URL('https://twitter.com/intent/tweet');
  // Decode before passing, is encoded by URL method.
  twitterShareUrl.searchParams.set('url', decodeURIComponent(thisPageUrl));
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
      <Suspense fallback={<WaitingIndicator maxLength={300} />}>
        <AsyncElem
          src={urlString}
          name={nameString}
          icsElem={icsElem}
          shareElements={shareElements}
          shared={isSharedPage}
        />
      </Suspense>
    </div>
  );
};

const AsyncElem = ({
  src,
  shared,
  name,
  icsElem,
  shareElements
}: {
  src: string;
  shared: boolean;
  name: string;
  icsElem: JSX.Element | null;
  shareElements: JSX.Element;
}) => {
  return fetch(new URL(src, getPrefix()))
    .then((res) => {
      if (res.status !== 200) {
        throw new Error('Failed to fetch ticket data');
      }
      return res.arrayBuffer();
    })
    .then((buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = buffer.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return `data:image/png;base64,${btoa(binary)}`;
    })
    .then((srcData) => {
      return (
        <>
          <div className='relative mx-auto my-4 max-w-full md:max-w-[700px]'>
            <img
              src={srcData}
              alt='My GLA Summit Ticket'
              width={'100%'}
              height={'auto'}
            />
          </div>
          {shared ? (
            <h3>
              This is {name}&apos;s ticket - get your own{' '}
              <Link href='/ticket'>
                <span className='link'>here</span>
              </Link>
              !
            </h3>
          ) : (
            <div className='flex flex-col items-center'>
              <h3>You&apos;re all set to go!</h3>
              <p>We can&apos;t wait to see you on the 25th and 26th March</p>
              {icsElem}
              {shareElements}
            </div>
          )}
        </>
      );
    })
    .catch((error) => {
      console.error('Failed to fetch ticket data', error);
      return (
        <div>
          <h3>Failed to fetch ticket data - the URL may be incorrect.</h3>
        </div>
      );
    });
};

export default TicketPage;

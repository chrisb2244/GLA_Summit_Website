import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH } from '@/app/api/ticket/constants';
import {
  startDate,
  ticketYear,
  TICKET_DESIGN_VERSION
} from '@/app/configConstants';
import {
  checkToken,
  paramStringToData,
  ticketDataAndTokenToPageUrl
} from '../utils';
import type { TransferObject } from '../page';
import Link from 'next/link';
import { Button } from '@/Components/Form/Button';
import { Suspense } from 'react';
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator';
import { getUser } from '@/lib/supabase/userFunctions';
import { NextParams, NextSearchParams, satisfy } from '@/lib/NextTypes';

type PageParams = satisfy<
  NextParams,
  Promise<{
    ticketObject: string;
  }>
>;

type PageProps = {
  params: PageParams;
  searchParams: NextSearchParams;
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
  // `v` busts the route's long, immutable image cache when the design changes;
  // it is ignored by the route and is not part of the signed token.
  const version = String(TICKET_DESIGN_VERSION);
  if (prefix) {
    const url = new URL('/api/ticket', prefix);
    url.searchParams.set('data', b64Data);
    url.searchParams.set('v', version);
    return url.href;
  } else {
    return `/api/ticket?data=${encodeURIComponent(b64Data)}&v=${version}`;
  }
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { ticketObject } = await params;

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
      description: `I've got my ticket for the GLA Summit ${ticketYear}!\r\nGet yours at https://glasummit.org/ticket`,
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
      description: `I've got my ticket for the GLA Summit ${ticketYear}!\r\nGet yours at https://glasummit.org/ticket`,
      images: [
        {
          url: ogImageUrl,
          alt: 'GLA Summit Ticket image'
        }
      ]
    }
  };
}

const TicketPage: NextPage<PageProps> = ({ params, searchParams }) => {
  return (
    <Suspense fallback={<WaitingIndicator maxLength={300} />}>
      <TicketPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
};

const TicketPageContent: NextPage<PageProps> = async ({
  params,
  searchParams
}) => {
  const { ticketObject: transferObjectString } = await params;
  const { share } = await searchParams;

  // Display different page if viewing someone else's shared ticket view.
  const user = await getUser();
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

  // The image route (/api/ticket) only generates the ticket PNG after
  // validating the HMAC token over the data payload. Mirror that check here,
  // inside the Suspense boundary, so a tampered URL renders an error instead of
  // a broken <img>. Awaiting here means the page waits for the image to be
  // known-good before rendering it.
  const tokenValid = await checkToken(
    transferObject.data,
    transferObject.token
  );
  if (!tokenValid) {
    return (
      <div>
        <h3>Failed to fetch ticket data.</h3>
      </div>
    );
  }

  const nameString = [
    transferObject.data.firstName,
    transferObject.data.lastName
  ].join(' ');

  // Same-origin, relative URL for the OG image route. Rendering it as a plain
  // <img> lets the browser load it directly (this route already renders
  // correctly when requested directly). The previous approach fetched this
  // route server-side via an absolute getPrefix() URL and inlined the PNG as a
  // data URI; that server-to-server request did not return 200 on production
  // or on preview deployments (the latter sit behind Vercel Deployment
  // Protection), which surfaced as "Failed to fetch ticket data".
  const imageSrc = ticketDataToRouteUrl(transferObject);

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

  const twitterMessage = `I've got my ticket for the GLA Summit ${ticketYear}! Get yours at https://glasummit.org/ticket #GLASummit`;
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

  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
  const getSuffixedDate = (date: number) => {
    if (date === 1 || date === 21 || date === 31) return `${date}st`;
    if (date === 2 || date === 22) return `${date}nd`;
    if (date === 3 || date === 23) return `${date}rd`;
    return `${date}th`;
  };
  const dateString =
    startMonth === endMonth
      ? `the ${getSuffixedDate(startDate.getDate())} and ${getSuffixedDate(
          endDate.getDate()
        )} of ${startMonth}`
      : `the ${getSuffixedDate(
          startDate.getDate()
        )} of ${startMonth} and the ${getSuffixedDate(
          endDate.getDate()
        )} of ${endMonth}`;

  return (
    <div className='mx-auto my-2 flex flex-col items-center text-xl'>
      <div className='relative mx-auto my-4 max-w-full md:max-w-[700px]'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt='My GLA Summit Ticket'
          width={'100%'}
          height={'auto'}
          // Reserve the intrinsic aspect ratio so the browser holds the layout
          // box before the image (loaded directly from the cacheable, versioned
          // /api/ticket URL) arrives, keeping CLS minimal.
          style={{ aspectRatio: `${IMG_WIDTH} / ${IMG_HEIGHT}` }}
        />
      </div>
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
          <p>We can&apos;t wait to see you on {dateString}</p>
          {icsElem}
          {shareElements}
        </div>
      )}
    </div>
  );
};

export default TicketPage;

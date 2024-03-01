import type { Metadata, NextPage } from 'next';
import { IMG_HEIGHT, IMG_WIDTH } from '@/app/api/ticket/constants';
import { createHmac } from 'node:crypto';

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

const TICKET_KEY = process.env.TICKET_KEY as string;

const parseParamString = (paramString: string): TicketData | undefined => {
  try {
    const asciiString = Buffer.from(paramString, 'base64').toString('ascii');
    return JSON.parse(asciiString);
  } catch (error) {
    return undefined;
  }
};

const paramStringToURL = (
  ticketObject: TicketData,
  prefix?: string
): string => {
  const b64Data = toB64(ticketObject);
  const token = getToken(b64Data);
  const calculatedString = `/api/ticket?token=${token}&data=${b64Data}`;
  if (prefix) {
    return new URL(calculatedString, prefix).href;
  }
  return calculatedString;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { ticketObject } = params;

  const ticketObj = parseParamString(ticketObject);
  if (!ticketObj) {
    // Invalid object, don't add to metadata
    return {};
  }
  const ogImageUrl = paramStringToURL(ticketObj, 'https://glasummit.org');

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

const toB64 = (dataObject: TicketData) => {
  const b64Data = Buffer.from(JSON.stringify(dataObject)).toString('base64');
  return b64Data;
};

const getToken = (data: string) => {
  const hmac = createHmac('sha256', TICKET_KEY);
  hmac.update(data);
  const token = hmac.digest('hex');
  return token;
};

const TicketPage: NextPage<PageProps> = async ({
  params: { ticketObject: ticketObjectString },
  searchParams: { share }
}) => {
  // Display different page if viewing someone else's shared ticket view.
  const isSharedPage = share === 'true';
  const ticketObject = parseParamString(ticketObjectString);

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
  const urlString = paramStringToURL(ticketObject);

  return (
    <div>
      {isSharedPage ? (
        <h3>Here&apos;s {nameString}&apos;s ticket!</h3>
      ) : (
        <h3>You&apos;re all set to go!</h3>
      )}
      <img src={urlString} width={IMG_WIDTH} height={IMG_HEIGHT} />
    </div>
  );
};

export default TicketPage;

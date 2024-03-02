import type { TicketData } from '@/app/ticket/[ticketObject]/page';

const TICKET_KEY = process.env.TICKET_KEY as string;

// object -> json string -> ascii to base64 -> (calc token) -> url encode
// url decode -> base64 to ascii -> json parse -> object

export const paramStringToData = (
  paramString: string
): TicketData | undefined => {
  try {
    const utfString = Buffer.from(
      decodeURIComponent(paramString),
      'base64'
    ).toString('ascii');
    return JSON.parse(utfString);
  } catch (error) {
    console.error('Failed to parse ticket data', error);
    return undefined;
  }
};

export const urlEncodedB64DataFromObject = (ticketObject: TicketData) => {
  return encodeURIComponent(
    Buffer.from(JSON.stringify(ticketObject)).toString('base64')
  );
};

export const ticketDataToPageUrl = (ticketObject: TicketData) => {
  const b64Data = urlEncodedB64DataFromObject(ticketObject);
  return `/ticket/${b64Data}`;
};

const toHex = (buffer: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => x.toString(16).padStart(2, '0'))
    .join('');
};

export const checkToken = async (data: string, token: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(TICKET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const verifyToken = toHex(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  );

  return verifyToken === token;
};

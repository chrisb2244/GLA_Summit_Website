import type { TicketData, TransferObject } from './page';

// object -> json string -> ascii to base64 -> (calc token) -> url encode
// url decode -> base64 to ascii -> json parse -> object

const IsObject = (obj: unknown): obj is Record<string, unknown> => {
  return typeof obj === 'object' && obj !== null;
};

const HasDataAndToken = (
  obj: object
): obj is { data: object; token: string } => {
  return (
    IsObject(obj) &&
    typeof obj.data === 'object' &&
    typeof obj.token === 'string'
  );
};

const IsTicketData = (obj: unknown): obj is TicketData => {
  return (
    IsObject(obj) &&
    typeof obj.ticketNumber === 'number' &&
    typeof obj.isPresenter === 'boolean' &&
    typeof obj.userId === 'string'
  );
};

const IsTransferObject = (obj: unknown): obj is TransferObject => {
  return IsObject(obj) && HasDataAndToken(obj) && IsTicketData(obj.data);
};

export const paramStringToData = (
  paramString: string
): TransferObject | undefined => {
  try {
    const utfString = Buffer.from(
      decodeURIComponent(paramString),
      'base64url'
    ).toString('utf-8');
    const parsed = JSON.parse(utfString);
    if (!IsTransferObject(parsed)) {
      return undefined;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to parse ticket data', error);
    return undefined;
  }
};

const urlEncodedB64DataFromObject = (obj: object) => {
  return encodeURIComponent(
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  );
};

export const ticketDataAndTokenToPageUrl = (
  ticketObject: TransferObject,
  prefix?: string
) => {
  const b64Data = urlEncodedB64DataFromObject(ticketObject);
  const path = `/ticket/${b64Data}`;
  return prefix ? new URL(path, prefix).href : path;
};

const toHex = (buffer: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => x.toString(16).padStart(2, '0'))
    .join('');
};

export const checkToken = async (data: TicketData, token: string) => {
  const TICKET_KEY = process.env.TICKET_KEY as string;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(TICKET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const verifyToken = toHex(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(JSON.stringify(data))
    )
  );

  return verifyToken === token;
};

export const fixedEncodeURI = (str: string) => {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16)
  );
};

import { createHmac } from 'crypto';

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type InviteTokenPayload = {
  presentationId: string;
  presenterId: string;
  exp: number; // Unix ms
};

type InviteTransferObject = {
  data: InviteTokenPayload;
  token: string;
};

const getKey = () => {
  const key = process.env.COPRESENTER_INVITE_KEY;
  if (!key) throw new Error('COPRESENTER_INVITE_KEY is not set');
  return key;
};

const sign = (payload: InviteTokenPayload): string => {
  const hmac = createHmac('sha256', getKey());
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
};

export const generateInviteToken = (
  presentationId: string,
  presenterId: string
): string => {
  const payload: InviteTokenPayload = {
    presentationId,
    presenterId,
    exp: Date.now() + EXPIRY_MS
  };
  const obj: InviteTransferObject = { data: payload, token: sign(payload) };
  return encodeURIComponent(
    Buffer.from(JSON.stringify(obj)).toString('base64url')
  );
};

const isInvitePayload = (obj: unknown): obj is InviteTokenPayload =>
  typeof obj === 'object' &&
  obj !== null &&
  typeof (obj as Record<string, unknown>).presentationId === 'string' &&
  typeof (obj as Record<string, unknown>).presenterId === 'string' &&
  typeof (obj as Record<string, unknown>).exp === 'number';

const isTransferObject = (obj: unknown): obj is InviteTransferObject =>
  typeof obj === 'object' &&
  obj !== null &&
  isInvitePayload((obj as Record<string, unknown>).data) &&
  typeof (obj as Record<string, unknown>).token === 'string';

export const verifyInviteToken = (
  tokenString: string
): InviteTokenPayload | null => {
  try {
    const decoded = Buffer.from(
      decodeURIComponent(tokenString),
      'base64url'
    ).toString('utf-8');
    const parsed: unknown = JSON.parse(decoded);
    if (!isTransferObject(parsed)) return null;

    const expectedToken = sign(parsed.data);
    if (expectedToken !== parsed.token) return null;

    if (Date.now() > parsed.data.exp) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

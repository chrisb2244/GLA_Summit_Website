import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { checkToken, paramStringToData, ticketDataAndTokenToPageUrl } from './utils';
import type { TicketData, TransferObject } from './page';

// ── helpers ──────────────────────────────────────────────────────────────────

const TEST_KEY = 'vitest-ticket-key';

const makeTicketData = (overrides: Partial<TicketData> = {}): TicketData => ({
  firstName: 'Test',
  lastName: 'User',
  ticketNumber: 42,
  isPresenter: false,
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  ...overrides,
});

const computeHmac = (data: TicketData): string => {
  const hmac = createHmac('sha256', TEST_KEY);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

const encodeTransferObject = (obj: TransferObject): string =>
  encodeURIComponent(Buffer.from(JSON.stringify(obj)).toString('base64url'));

// ── checkToken ───────────────────────────────────────────────────────────────

describe('checkToken', () => {
  beforeEach(() => {
    vi.stubEnv('TICKET_KEY', TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true for a valid HMAC token', async () => {
    const data = makeTicketData();
    const token = computeHmac(data);
    expect(await checkToken(data, token)).toBe(true);
  });

  it('returns false when the ticket number has been changed', async () => {
    const data = makeTicketData();
    const token = computeHmac(data);
    const tampered = { ...data, ticketNumber: data.ticketNumber + 1 };
    expect(await checkToken(tampered, token)).toBe(false);
  });

  it('returns false when the userId has been changed', async () => {
    const data = makeTicketData();
    const token = computeHmac(data);
    const tampered = { ...data, userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' };
    expect(await checkToken(tampered, token)).toBe(false);
  });

  it('returns false when the isPresenter flag has been flipped', async () => {
    const data = makeTicketData({ isPresenter: false });
    const token = computeHmac(data);
    const tampered = { ...data, isPresenter: true };
    expect(await checkToken(tampered, token)).toBe(false);
  });

  it('returns false for a well-formed but incorrect hex token', async () => {
    const data = makeTicketData();
    const wrongToken = 'deadbeef'.repeat(8);
    expect(await checkToken(data, wrongToken)).toBe(false);
  });
});

// ── paramStringToData ─────────────────────────────────────────────────────────

describe('paramStringToData', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined for an empty string', () => {
    expect(paramStringToData('')).toBeUndefined();
  });

  it('returns undefined for a non-base64 string', () => {
    expect(paramStringToData('not valid base64!!')).toBeUndefined();
  });

  it('returns undefined for base64 that decodes to non-JSON bytes', () => {
    const encoded = encodeURIComponent(
      Buffer.from('this is not json').toString('base64url')
    );
    expect(paramStringToData(encoded)).toBeUndefined();
  });

  it('returns undefined when the required ticketNumber field is missing', () => {
    const incomplete = {
      data: { firstName: 'X', isPresenter: false, userId: 'u1' },
      token: 'abc',
    };
    const encoded = encodeURIComponent(
      Buffer.from(JSON.stringify(incomplete)).toString('base64url')
    );
    expect(paramStringToData(encoded)).toBeUndefined();
  });

  it('returns undefined when the required userId field is missing', () => {
    const incomplete = {
      data: { firstName: 'X', isPresenter: false, ticketNumber: 1 },
      token: 'abc',
    };
    const encoded = encodeURIComponent(
      Buffer.from(JSON.stringify(incomplete)).toString('base64url')
    );
    expect(paramStringToData(encoded)).toBeUndefined();
  });

  it('returns undefined when the required isPresenter field is missing', () => {
    const incomplete = {
      data: { firstName: 'X', ticketNumber: 1, userId: 'u1' },
      token: 'abc',
    };
    const encoded = encodeURIComponent(
      Buffer.from(JSON.stringify(incomplete)).toString('base64url')
    );
    expect(paramStringToData(encoded)).toBeUndefined();
  });

  it('returns the decoded transfer object for valid input', () => {
    const obj: TransferObject = {
      data: makeTicketData(),
      token: 'some-token',
    };
    const encoded = encodeTransferObject(obj);
    expect(paramStringToData(encoded)).toEqual(obj);
  });

  it('preserves all TicketData fields through the encode/decode round-trip', () => {
    const data = makeTicketData({ isPresenter: true, ticketNumber: 999 });
    const obj: TransferObject = { data, token: 'round-trip-token' };
    const encoded = encodeTransferObject(obj);
    const result = paramStringToData(encoded);
    expect(result?.data).toEqual(data);
  });
});

// ── ticketDataAndTokenToPageUrl ───────────────────────────────────────────────

describe('ticketDataAndTokenToPageUrl', () => {
  const obj: TransferObject = { data: makeTicketData(), token: 'tok' };

  it('returns a path starting with /ticket/', () => {
    expect(ticketDataAndTokenToPageUrl(obj)).toMatch(/^\/ticket\/.+/);
  });

  it('returns a full absolute URL when a prefix is supplied', () => {
    const url = ticketDataAndTokenToPageUrl(obj, 'https://glasummit.org');
    expect(url).toMatch(/^https:\/\/glasummit\.org\/ticket\/.+/);
  });

  it('round-trips through paramStringToData', () => {
    const path = ticketDataAndTokenToPageUrl(obj);
    const encoded = path.split('/ticket/')[1];
    expect(paramStringToData(encoded)).toEqual(obj);
  });

  it('produces different URLs for different ticket data', () => {
    const other: TransferObject = {
      data: makeTicketData({ ticketNumber: 99 }),
      token: 'tok',
    };
    expect(ticketDataAndTokenToPageUrl(obj)).not.toBe(
      ticketDataAndTokenToPageUrl(other)
    );
  });
});

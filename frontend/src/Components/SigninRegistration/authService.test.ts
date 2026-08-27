import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
// `after` defers work past the response; run it inline so the assertions below
// can see what was logged.
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));
vi.mock('@/lib/sendMail', () => ({ sendMailApi: vi.fn() }));
vi.mock('@/lib/generateSupabaseLinks', () => ({ generateSupabaseLinks: vi.fn() }));
vi.mock('@/lib/databaseFunctions', () => ({ resolveAccountEmail: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));
vi.mock('@/EmailTemplates/RegistrationEmail', () => ({ RegistrationEmailFn: vi.fn() }));
vi.mock('@/EmailTemplates/SignInEmail', () => ({ SignInEmailFn: vi.fn() }));

import { resolveAccountEmail } from '@/lib/databaseFunctions';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logToDb } from '@/lib/utils';

import { verifyLogin } from './authService';

const ALIAS = 'alias@example.com';
const PRIMARY = 'primary@example.com';

const mockVerifyOtp = (result: unknown) => {
  const verifyOtp = vi.fn().mockResolvedValue(result);
  vi.mocked(createServerActionClient).mockResolvedValue({
    auth: { verifyOtp }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return verifyOtp;
};

const rejectionLogs = () =>
  vi
    .mocked(logToDb)
    .mock.calls.filter((call) => call[1] === 'OTP verification rejected');

describe('verifyLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies the code against the primary address when an alias was typed', async () => {
    vi.mocked(resolveAccountEmail).mockResolvedValue({
      userId: 'user-1',
      primaryEmail: PRIMARY
    });
    const verifyOtp = mockVerifyOtp({ data: { user: { id: 'user-1' } }, error: null });

    await expect(verifyLogin({ email: ALIAS, verificationCode: '123456' })).resolves.toBe(
      true
    );
    // GoTrue only knows the primary; the alias is ours to resolve.
    expect(verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: PRIMARY, token: '123456' })
    );
  });

  it('records a rejection when no account holds the address', async () => {
    vi.mocked(resolveAccountEmail).mockResolvedValue(null);

    await expect(
      verifyLogin({ email: 'nobody@example.com', verificationCode: '123456' })
    ).resolves.toBe(false);

    // This is the case that previously returned early and logged nothing, so
    // working through a list of addresses left no trace on this path at all.
    expect(rejectionLogs()).toHaveLength(1);
    expect(rejectionLogs()[0][3]).toMatchObject({
      context: { email: 'nobody@example.com', code: 'no_account' }
    });
  });

  it('returns false rather than throwing when the lookup fails', async () => {
    vi.mocked(resolveAccountEmail).mockRejectedValue(new Error('PostgREST is down'));

    // An unhandled throw here reaches the browser as a server-action error
    // instead of the rejected code the caller is contracted to handle.
    await expect(
      verifyLogin({ email: ALIAS, verificationCode: '123456' })
    ).resolves.toBe(false);

    expect(rejectionLogs()[0][0]).toBe('error');
    expect(rejectionLogs()[0][3]).toMatchObject({
      context: { code: 'lookup_failed', message: 'PostgREST is down' }
    });
  });

  it('records an expired code as an ordinary mistake, not an error', async () => {
    vi.mocked(resolveAccountEmail).mockResolvedValue({
      userId: 'user-1',
      primaryEmail: PRIMARY
    });
    mockVerifyOtp({
      data: { user: null },
      error: { status: 403, code: 'otp_expired', message: 'Token has expired' }
    });

    await expect(
      verifyLogin({ email: PRIMARY, verificationCode: '000000' })
    ).resolves.toBe(false);

    expect(rejectionLogs()[0][0]).toBe('info');
    expect(rejectionLogs()[0][3]).toMatchObject({
      context: { code: 'otp_expired' }
    });
  });
});

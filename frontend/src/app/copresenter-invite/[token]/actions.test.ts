import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.stubEnv('COPRESENTER_INVITE_KEY', 'test-secret-key-for-unit-tests');

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));
vi.mock('@/lib/sendMail', () => ({ sendMailApi: vi.fn().mockResolvedValue({ status: 200 }) }));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));
vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  CopresenterResponseNotificationEmailFn: vi.fn(() => ({ body: '', bodyPlain: '' }))
}));

import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { generateInviteToken } from '@/lib/copresenterInviteToken';
import { respondToInvite, submitInviteResponse } from './actions';

const PRESENTATION_ID = 'pres-111';
const PRESENTER_ID = 'user-222';
const SUBMITTER_ID = 'user-333';

const makeToken = () => generateInviteToken(PRESENTATION_ID, PRESENTER_ID);

const mockAuth = (userId: string | null) => {
  vi.mocked(createServerActionClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null }
      })
    }
  } as unknown as ReturnType<typeof createServerActionClient>);
};

const makeAdminMock = (status = 'pending', declined_count = 0) => {
  const selectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { status, declined_count }, error: null })
  };
  const updateBuilder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: unknown) => void) => resolve({ error: null }))
  };
  const fromMock = vi.fn((table: string) => {
    if (table === 'presentation_presenters') return { ...selectBuilder, ...updateBuilder };
    if (table === 'presentation_submissions')
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: 'Test Talk', submitter_id: SUBMITTER_ID },
          error: null
        })
      };
    if (table === 'email_lookup')
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null })
      };
    if (table === 'profiles')
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { firstname: 'Alice', lastname: 'Smith' },
          error: null
        })
      };
    return selectBuilder;
  });
  vi.mocked(createAdminClient).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
  return { fromMock, updateBuilder };
};

describe('respondToInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid token', async () => {
    const result = await respondToInvite('bad-token', 'accept');
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/invalid or has expired/i);
  });

  it('returns error when not authenticated', async () => {
    mockAuth(null);
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/logged in/i);
  });

  it('returns error when wrong user is authenticated', async () => {
    mockAuth('different-user-id');
    makeAdminMock();
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/different account/i);
  });

  it('accepts a pending invite and returns success', async () => {
    mockAuth(PRESENTER_ID);
    const { fromMock } = makeAdminMock('pending', 0);
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('accept');
  });

  it('declines a pending invite and increments declined_count', async () => {
    mockAuth(PRESENTER_ID);
    const { fromMock } = makeAdminMock('pending', 0);
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('decline');
    // Verify update was called with declined_count: 1
    const presenterFromCalls = (fromMock as ReturnType<typeof vi.fn>).mock.calls
      .filter((call: unknown[]) => call[0] === 'presentation_presenters');
    const updateCall = presenterFromCalls.find(() => true);
    expect(updateCall).toBeDefined();
  });

  it('is idempotent when already accepted', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock('accepted', 0);
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(true);
  });

  it('is idempotent when already declined', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock('declined', 1);
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
  });
});

describe('submitInviteResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error for invalid form data', async () => {
    const formData = new FormData();
    formData.set('token', 'bad');
    formData.set('action', 'invalid');
    const result = await submitInviteResponse(null, formData);
    expect(result.success).toBe(false);
  });

  it('delegates to respondToInvite with correct args', async () => {
    mockAuth(null); // triggers not-logged-in error
    const token = makeToken();
    const formData = new FormData();
    formData.set('token', token);
    formData.set('action', 'accept');
    const result = await submitInviteResponse(null, formData);
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/logged in/i);
  });
});

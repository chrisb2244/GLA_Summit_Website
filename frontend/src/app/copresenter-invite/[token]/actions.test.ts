import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.stubEnv('COPRESENTER_INVITE_KEY', 'test-secret-key-for-unit-tests');

// This suite exercises the workflow-enabled path (the server-side gate is open).
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: true
}));

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));
vi.mock('@/lib/sendMail', () => ({ sendMailApi: vi.fn().mockResolvedValue({ status: 200 }) }));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));
vi.mock('@/EmailTemplates/FormSubmissionEmail', () => ({
  CopresenterResponseNotificationEmailFn: vi.fn(() => ({ body: '', bodyPlain: '' }))
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/supabase/cacheTags';
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

type AdminOptions = {
  /** Status of the presenter row on the initial read. */
  status?: 'pending' | 'accepted' | 'declined';
  declined_count?: number;
  /**
   * Rows returned by the guarded `update(...).select('status')`. Defaults to a
   * single row (a successful pending→accepted/declined transition). Pass `[]`
   * to simulate losing an optimistic-concurrency race.
   */
  updatedRows?: Array<{ status: string }>;
  /** Status re-read after a lost race (the decision that actually landed). */
  latestStatus?: 'accepted' | 'declined' | 'pending' | null;
  year?: string;
};

// Builds a query-aware admin client. The presentation_presenters table is
// accessed up to three times per respondToInvite call:
//   1. initial read       — select(...).eq().eq().single()        → currentRow
//   2. guarded update      — update(...).eq().eq().eq().select()   → updatedRows
//   3. lost-race re-read    — select(...).eq().eq().single()        → latestRow
// A per-`from('presentation_presenters')` call counter routes each chain to the
// right terminal value.
const makeAdminMock = (opts: AdminOptions = {}) => {
  const status = opts.status ?? 'pending';
  const declined_count = opts.declined_count ?? 0;
  const updatedRows = opts.updatedRows ?? [{ status: 'accepted' }];
  const latestStatus = opts.latestStatus ?? null;

  let presenterFromCall = 0;

  const presentersBuilder = () => {
    presenterFromCall += 1;
    const callIndex = presenterFromCall;
    let isUpdate = false;
    const builder: Record<string, unknown> = {
      update: vi.fn(() => {
        isUpdate = true;
        return builder;
      }),
      eq: vi.fn(() => builder),
      select: vi.fn(() => {
        // After update(), select() is terminal and resolves to the affected rows.
        if (isUpdate) {
          return Promise.resolve({ data: updatedRows, error: null });
        }
        return builder;
      }),
      single: vi.fn(() => {
        if (callIndex === 1) {
          return Promise.resolve({ data: { status, declined_count }, error: null });
        }
        return Promise.resolve({
          data: latestStatus ? { status: latestStatus } : null,
          error: null
        });
      })
    };
    return builder;
  };

  const fromMock = vi.fn((table: string) => {
    if (table === 'presentation_presenters') return presentersBuilder();
    if (table === 'presentation_submissions')
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { title: 'Test Talk', submitter_id: SUBMITTER_ID, year: opts.year ?? '2026' },
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
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    };
  });
  vi.mocked(createAdminClient).mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
  return { fromMock };
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
    makeAdminMock({ status: 'pending', declined_count: 0 });
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('accept');
  });

  it('declines a pending invite, guarding the update on status=pending and incrementing declined_count', async () => {
    mockAuth(PRESENTER_ID);
    const { fromMock } = makeAdminMock({ status: 'pending', declined_count: 0 });
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('decline');

    // The update call must be guarded by .eq('status', 'pending') and must write
    // declined_count: 1 (read 0 + 1).
    const updateBuilder = fromMock.mock.results
      .map((r) => r.value as Record<string, ReturnType<typeof vi.fn>>)
      .find((b) => b.update && (b.update as ReturnType<typeof vi.fn>).mock.calls.length > 0);
    expect(updateBuilder).toBeDefined();
    expect(updateBuilder!.update).toHaveBeenCalledWith({ status: 'declined', declined_count: 1 });
    expect(updateBuilder!.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('revalidates the accepted-presenter caches after a successful response', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'pending', year: '2026' });
    await respondToInvite(makeToken(), 'accept');
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.acceptedPresenterIds, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(
      `${CACHE_TAGS.acceptedPresenterIds}:2026`,
      { expire: 0 }
    );
  });

  it('does not revalidate caches when the response is not recorded', async () => {
    mockAuth(PRESENTER_ID);
    // Already declined: idempotent short-circuit, no write, no cache work.
    makeAdminMock({ status: 'declined', declined_count: 1 });
    await respondToInvite(makeToken(), 'accept');
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('is idempotent when already accepted (reports the stored decision)', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'accepted', declined_count: 0 });
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('accept');
  });

  it('is idempotent when already declined (reports the stored decision)', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'declined', declined_count: 1 });
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('decline');
  });

  it('reports the stored "decline" when an accept link is used after declining', async () => {
    // A stale accept link clicked after the user already declined must not claim
    // acceptance — it reports the actual stored decision.
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'declined', declined_count: 1 });
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('decline');
  });

  it('reports the stored "accept" when a decline link is used after accepting', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'accepted', declined_count: 0 });
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('accept');
  });

  it('on a lost concurrency race, reports the decision that actually landed', async () => {
    // Row read as pending, but the guarded update matches zero rows because a
    // concurrent request already accepted it. We re-read and report 'accept'.
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'pending', updatedRows: [], latestStatus: 'accepted' });
    const result = await respondToInvite(makeToken(), 'decline');
    expect(result.success).toBe(true);
    expect((result as { success: true; action: string }).action).toBe('accept');
    // No double-counting: the caller's own update wrote nothing.
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('fails cleanly if a lost race leaves the row in an unexpected state', async () => {
    mockAuth(PRESENTER_ID);
    makeAdminMock({ status: 'pending', updatedRows: [], latestStatus: null });
    const result = await respondToInvite(makeToken(), 'accept');
    expect(result.success).toBe(false);
    expect((result as { success: false; error: string }).error).toMatch(/try again/i);
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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forceSubmissionOutcome } from './actions';
import { createServerClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/supabaseServer', () => ({
  createServerClient: vi.fn()
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
}));
vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn(),
  joinNames: vi.fn()
}));

/**
 * Supabase mock for forceSubmissionOutcome, which reaches getUserDataForMenu
 * (organizers count + profile) then checks submission_concluders and calls the
 * force RPC.
 */
const buildClient = (opts: {
  userId: string | null;
  isOrganizer?: boolean;
  isConcluder?: boolean;
  rpcError?: { message: string; code: string } | null;
}) => {
  const rpc = vi.fn().mockResolvedValue({
    data: opts.rpcError ? null : 'accepted',
    error: opts.rpcError ?? null
  });

  const from = vi.fn((table: string) => {
    switch (table) {
      case 'organizers':
        return {
          select: vi.fn(() => ({
            eq: vi
              .fn()
              .mockResolvedValue({ count: opts.isOrganizer ? 1 : 0 })
          }))
        };
      case 'profiles':
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: opts.userId, firstname: 'T', lastname: 'U' }
              })
            }))
          }))
        };
      case 'submission_concluders':
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: opts.isConcluder ? [{ user_id: opts.userId }] : []
            })
          }))
        };
      default:
        throw new Error(`unexpected table ${table}`);
    }
  });

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.userId ? { id: opts.userId } : null }
      })
    },
    from,
    rpc
  };
  vi.mocked(createServerClient).mockResolvedValue(client as never);
  return { rpc };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('forceSubmissionOutcome', () => {
  it('rejects a signed-out user', async () => {
    const { rpc } = buildClient({ userId: null });
    const res = await forceSubmissionOutcome('pres-1', 'accepted');
    expect(res.success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a non-organizer', async () => {
    const { rpc } = buildClient({ userId: 'u-1', isOrganizer: false });
    const res = await forceSubmissionOutcome('pres-1', 'accepted');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/organizers/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects an organizer who is not a concluder', async () => {
    const { rpc } = buildClient({
      userId: 'u-1',
      isOrganizer: true,
      isConcluder: false
    });
    const res = await forceSubmissionOutcome('pres-1', 'accepted');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not permitted/i);
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('calls the RPC and revalidates for an authorized concluder', async () => {
    const { rpc } = buildClient({
      userId: 'u-1',
      isOrganizer: true,
      isConcluder: true
    });
    const res = await forceSubmissionOutcome('pres-1', 'declined');
    expect(res.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith('force_submission_outcome', {
      v_pid: 'pres-1',
      v_outcome: 'declined'
    });
    expect(revalidatePath).toHaveBeenCalledWith('/review-submissions');
  });

  it('surfaces a friendly message when the submission is already concluded', async () => {
    const { rpc } = buildClient({
      userId: 'u-1',
      isOrganizer: true,
      isConcluder: true,
      rpcError: {
        message: 'force_submission_outcome: submission already concluded',
        code: 'P0001'
      }
    });
    const res = await forceSubmissionOutcome('pres-1', 'accepted');
    expect(rpc).toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already been concluded/i);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

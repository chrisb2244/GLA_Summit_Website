import { beforeEach, describe, expect, it, vi } from 'vitest';
import { castVote } from './actions';
import { createServerClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/supabaseServer', () => ({
  createServerClient: vi.fn()
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  // castVote reaches getUserDataForMenu, which uses these cache primitives.
  cacheLife: vi.fn(),
  cacheTag: vi.fn()
}));
vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn(),
  joinNames: vi.fn()
}));

type CountResult = { count: number | null; error?: null };

/**
 * Build a supabase mock whose `.from(table)` returns a chain. Each table's
 * terminal value is configured via `tables`. Count-style reads resolve the chain
 * to `{ count }`; mutation reads (upsert/delete) resolve to `{ error }`.
 */
const buildClient = (opts: {
  userId: string | null;
  organizerCount: number;
  acceptedCount?: number;
  rejectedCount?: number;
  mutationError?: { message: string; code: string } | null;
}) => {
  const upsert = vi.fn().mockResolvedValue({ error: opts.mutationError ?? null });
  const deleteChain = {
    eq: vi.fn().mockReturnThis(),
    then: (resolve: (v: { error: unknown }) => unknown) =>
      resolve({ error: opts.mutationError ?? null })
  };
  const del = vi.fn(() => deleteChain);

  const countFor = (count: number): { select: ReturnType<typeof vi.fn> } => ({
    select: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ count } as CountResult)
    }))
  });

  const from = vi.fn((table: string) => {
    switch (table) {
      case 'organizers':
        return countFor(opts.organizerCount);
      case 'accepted_presentations':
        return countFor(opts.acceptedCount ?? 0);
      case 'rejected_presentations':
        return countFor(opts.rejectedCount ?? 0);
      case 'submission_votes':
        return { upsert, delete: del };
      case 'profiles':
        // getUserDataForMenu fetches the caller's profile after the organizer
        // count; the value is irrelevant to castVote, it just must resolve.
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: opts.userId, firstname: 'T', lastname: 'U' }
              })
            }))
          }))
        };
      default:
        throw new Error(`unexpected table ${table}`);
    }
  });

  const client = {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: opts.userId ? { id: opts.userId } : null } })
    },
    from
  };
  vi.mocked(createServerClient).mockResolvedValue(client as never);
  return { upsert, del, deleteChain };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('castVote', () => {
  it('rejects a signed-out user', async () => {
    buildClient({ userId: null, organizerCount: 0 });
    const res = await castVote('pres-1', 'for');
    expect(res.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a non-organizer', async () => {
    const { upsert } = buildClient({ userId: 'u-1', organizerCount: 0 });
    const res = await castVote('pres-1', 'for');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/organizers/i);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses to vote once the submission has an outcome', async () => {
    const { upsert } = buildClient({
      userId: 'u-1',
      organizerCount: 1,
      acceptedCount: 1
    });
    const res = await castVote('pres-1', 'for');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no longer under review/i);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upserts a vote for an organizer and revalidates', async () => {
    const { upsert } = buildClient({ userId: 'u-1', organizerCount: 1 });
    const res = await castVote('pres-1', 'against');
    expect(res.success).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        presentation_id: 'pres-1',
        organizer_id: 'u-1',
        vote: 'against'
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/review-submissions');
  });

  it('deletes the vote row when clearing (vote === null)', async () => {
    const { upsert, del } = buildClient({ userId: 'u-1', organizerCount: 1 });
    const res = await castVote('pres-1', null);
    expect(res.success).toBe(true);
    expect(del).toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/review-submissions');
  });

  it('returns failure when the mutation errors', async () => {
    buildClient({
      userId: 'u-1',
      organizerCount: 1,
      mutationError: { message: 'boom', code: '500' }
    });
    const res = await castVote('pres-1', 'for');
    expect(res.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

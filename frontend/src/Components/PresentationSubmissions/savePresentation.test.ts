import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormData } from './PresentationSubmissionFormSchema';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));

// Workflow ON: newly-inserted co-presenters start 'pending' and must accept.
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: true,
  submissionsForYear: '2026'
}));

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));

// Isolate the presenter-categorisation/prune logic from account resolution.
vi.mock('./copresenterHelpers', () => ({
  resolveCopresenters: vi.fn()
}));

import { savePresentation } from './savePresentation';
import { resolveCopresenters } from './copresenterHelpers';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';

const PRESENTATION_ID = 'pres-existing-1';
const SUBMITTER_ID = 'submitter-1';

const baseFormData = (): PresentationSubmissionFormData =>
  ({
    title: 'A Talk',
    abstract: 'x'.repeat(150),
    learningPoints: 'lp '.repeat(20),
    presentationType: 'full length',
    submitIntent: 'draft',
    speakerAgreement: false,
    otherPresenters: [],
    submitter: {
      firstName: 'Sub',
      lastName: 'Mitter',
      email: 'submitter@example.com'
    },
    presentationId: PRESENTATION_ID
  }) as unknown as PresentationSubmissionFormData;

// Server action client only needs to satisfy uploadPresentation's existing-row
// UPDATE: .from('presentation_submissions').update().eq().eq().select().single().
const mockServerClient = () => {
  vi.mocked(createServerActionClient).mockResolvedValue({
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: PRESENTATION_ID }, error: null })
    }))
  } as unknown as Awaited<ReturnType<typeof createServerActionClient>>);
};

type AdminOpts = {
  existingRows?: Array<{ presenter_id: string; status: string; declined_count: number }>;
  prunedRows?: Array<{ presenter_id: string }>;
  prunedEmails?: Array<{ user_id: string; email: string }>;
};

const mockAdminClient = (opts: AdminOpts = {}) => {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({ error: null });
  const reinviteIn = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: vi.fn().mockReturnThis(), in: reinviteIn }));

  const presentersFrom = {
    upsert,
    insert,
    select: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: opts.existingRows ?? [], error: null })
    })),
    update,
    delete: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: opts.prunedRows ?? [], error: null })
    }))
  };

  const accountEmailsFrom = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn().mockResolvedValue({
          data: opts.prunedEmails ?? [],
          error: null
        })
      }))
    }))
  };

  const from = vi.fn((table: string) => {
    if (table === 'presentation_presenters') return presentersFrom;
    if (table === 'account_emails') return accountEmailsFrom;
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });

  vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<
    typeof createAdminClient
  >);
  return { upsert, insert, reinviteIn, update, presentersFrom };
};

describe('savePresentation — presenter categorisation (workflow ON)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerClient();
  });

  it('inserts brand-new co-presenters with status "pending"', async () => {
    vi.mocked(resolveCopresenters).mockResolvedValue({
      success: true,
      existingPresenters: [{ id: 'cp-new', email: 'new@example.com', inviteUrl: '/i/1' }],
      newPresenters: []
    });
    const { insert } = mockAdminClient({ existingRows: [] });

    const result = await savePresentation({
      presentationData: baseFormData(),
      submitterId: SUBMITTER_ID,
      callerName: 'test',
      presentationId: PRESENTATION_ID
    });

    expect(result.success).toBe(true);
    expect(insert).toHaveBeenCalledWith([
      { presenter_id: 'cp-new', presentation_id: PRESENTATION_ID, status: 'pending' }
    ]);
  });

  it('categorises declined<2 as reinvited and resets them to pending; declined>=2 as spam-blocked', async () => {
    vi.mocked(resolveCopresenters).mockResolvedValue({
      success: true,
      existingPresenters: [
        { id: 'cp-fresh', email: 'fresh@example.com', inviteUrl: '/i/fresh' },
        { id: 'cp-reinvite', email: 'reinvite@example.com', inviteUrl: '/i/re' },
        { id: 'cp-spam', email: 'spam@example.com', inviteUrl: '/i/spam' }
      ],
      newPresenters: []
    });
    const { insert, update, reinviteIn } = mockAdminClient({
      existingRows: [
        { presenter_id: 'cp-reinvite', status: 'declined', declined_count: 1 },
        { presenter_id: 'cp-spam', status: 'declined', declined_count: 2 }
      ]
    });

    const result = await savePresentation({
      presentationData: baseFormData(),
      submitterId: SUBMITTER_ID,
      callerName: 'test',
      presentationId: PRESENTATION_ID
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Only cp-fresh is genuinely new.
    expect(insert).toHaveBeenCalledWith([
      { presenter_id: 'cp-fresh', presentation_id: PRESENTATION_ID, status: 'pending' }
    ]);
    // cp-reinvite is reset to pending; cp-spam is NOT.
    expect(update).toHaveBeenCalledWith({ status: 'pending' });
    expect(reinviteIn).toHaveBeenCalledWith('presenter_id', ['cp-reinvite']);

    const { newlyInvited, reinvited, spamBlocked } = result.copresenterTargets;
    expect(newlyInvited.map((p) => p.id)).toEqual(['cp-fresh']);
    expect(reinvited.map((p) => p.id)).toEqual(['cp-reinvite']);
    expect(spamBlocked.map((p) => p.id)).toEqual(['cp-spam']);
  });

  it('prunes presenters no longer on the form and returns their emails', async () => {
    vi.mocked(resolveCopresenters).mockResolvedValue({
      success: true,
      existingPresenters: [{ id: 'cp-keep', email: 'keep@example.com', inviteUrl: '/i/keep' }],
      newPresenters: []
    });
    const { presentersFrom } = mockAdminClient({
      existingRows: [{ presenter_id: 'cp-keep', status: 'pending', declined_count: 0 }],
      prunedRows: [{ presenter_id: 'cp-removed' }],
      prunedEmails: [{ user_id: 'cp-removed', email: 'removed@example.com' }]
    });

    const result = await savePresentation({
      presentationData: baseFormData(),
      submitterId: SUBMITTER_ID,
      callerName: 'test',
      presentationId: PRESENTATION_ID
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(presentersFrom.delete).toHaveBeenCalled();
    expect(result.prunedPresenters).toEqual([
      { id: 'cp-removed', email: 'removed@example.com' }
    ]);
  });
});

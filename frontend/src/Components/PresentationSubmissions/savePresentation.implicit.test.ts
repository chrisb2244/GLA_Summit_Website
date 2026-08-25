import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationSubmissionFormData } from './PresentationSubmissionFormSchema';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/utils', () => ({ logToDb: vi.fn() }));

// Workflow OFF: co-presenters are implicitly accepted on insert.
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: false,
  submissionsForYear: '2026'
}));

vi.mock('@/lib/supabaseClient', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ createServerActionClient: vi.fn() }));
vi.mock('./copresenterHelpers', () => ({ resolveCopresenters: vi.fn() }));

import { savePresentation } from './savePresentation';
import { resolveCopresenters } from './copresenterHelpers';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';

const PRESENTATION_ID = 'pres-existing-1';

const formData = (): PresentationSubmissionFormData =>
  ({
    title: 'A Talk',
    abstract: 'x'.repeat(150),
    learningPoints: 'lp '.repeat(20),
    presentationType: 'full length',
    submitIntent: 'draft',
    speakerAgreement: false,
    otherPresenters: [],
    submitter: { firstName: 'Sub', lastName: 'Mitter', email: 'submitter@example.com' },
    presentationId: PRESENTATION_ID
  }) as unknown as PresentationSubmissionFormData;

describe('savePresentation — presenter categorisation (workflow OFF)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServerActionClient).mockResolvedValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: PRESENTATION_ID }, error: null })
      }))
    } as unknown as Awaited<ReturnType<typeof createServerActionClient>>);
  });

  it('inserts brand-new co-presenters with status "accepted"', async () => {
    vi.mocked(resolveCopresenters).mockResolvedValue({
      success: true,
      existingPresenters: [{ id: 'cp-new', email: 'new@example.com' }],
      newPresenters: []
    });

    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === 'presentation_presenters')
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
          insert,
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null })
          })),
          update: vi.fn(() => ({ eq: vi.fn().mockReturnThis(), in: vi.fn() })),
          delete: vi.fn(() => ({
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      if (table === 'account_emails')
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          }))
        };
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });
    vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<
      typeof createAdminClient
    >);

    const result = await savePresentation({
      presentationData: formData(),
      submitterId: 'submitter-1',
      callerName: 'test',
      presentationId: PRESENTATION_ID
    });

    expect(result.success).toBe(true);
    expect(insert).toHaveBeenCalledWith([
      { presenter_id: 'cp-new', presentation_id: PRESENTATION_ID, status: 'accepted' }
    ]);
  });
});

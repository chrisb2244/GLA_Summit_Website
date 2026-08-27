import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient } from '@/lib/supabaseClient';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

vi.mock('@/lib/copresenterInviteToken', () => ({
  generateInviteToken: vi.fn((pid: string, uid: string) => `${pid}:${uid}`)
}));

vi.mock('@/Components/SigninRegistration/formState', () => ({
  buildValidateLoginUrl: vi.fn(() => '/auth/validateLogin?email=test')
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomBytes: vi.fn(() => ({ toString: () => 'mock-random-password' }))
  };
});

// Implicit-acceptance path: the invite workflow is OFF, so no tokens are minted.
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: false
}));

import { resolveCopresenters } from './copresenterHelpers';
import { generateInviteToken } from '@/lib/copresenterInviteToken';
import { buildValidateLoginUrl } from '@/Components/SigninRegistration/formState';

const PRESENTATION_ID = 'pres-001';
const SUBMITTER_ID = 'sub-001';

const makeAdmin = (
  initialQueryData: Array<{ user_id: string; email: string }> = []
) => {
  const emailLookupBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: initialQueryData, error: null }),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  };
  const generateLinkMock = vi.fn().mockResolvedValue({
    data: { user: { id: 'new-user-id' }, properties: { email_otp: 'otp-123' } },
    error: null
  });
  const mockAdmin = {
    from: vi.fn(() => emailLookupBuilder),
    auth: { admin: { generateLink: generateLinkMock } }
  } as unknown as ReturnType<typeof createAdminClient>;
  return { mockAdmin };
};

describe('resolveCopresenters with the invite workflow disabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not attach an inviteUrl to existing presenters', async () => {
    const { mockAdmin } = makeAdmin([{ user_id: 'user-1', email: 'alice@example.com' }]);

    const result = await resolveCopresenters(
      ['alice@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.existingPresenters[0].inviteUrl).toBeUndefined();
  });

  it('does not mint invite tokens', async () => {
    const { mockAdmin } = makeAdmin([{ user_id: 'user-1', email: 'alice@example.com' }]);

    await resolveCopresenters(
      ['alice@example.com', 'new@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(generateInviteToken).not.toHaveBeenCalled();
  });

  it('builds a plain login link (no invite redirect) for new presenters', async () => {
    const { mockAdmin } = makeAdmin([]);

    await resolveCopresenters(
      ['new@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(buildValidateLoginUrl).toHaveBeenCalledWith('new@example.com', undefined);
  });
});

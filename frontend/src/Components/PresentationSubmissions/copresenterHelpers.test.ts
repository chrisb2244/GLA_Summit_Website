import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient } from '@/lib/supabaseClient';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

vi.mock('@/lib/copresenterInviteToken', () => ({
  generateInviteToken: vi.fn((pid: string, uid: string) => `${pid}:${uid}`)
}));

// This suite exercises the workflow-enabled path (invite tokens minted).
vi.mock('@/app/configConstants', () => ({
  COPRESENTER_INVITE_WORKFLOW: true
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

import { resolveCopresenters } from './copresenterHelpers';

const PRESENTATION_ID = 'pres-001';
const SUBMITTER_ID = 'sub-001';

type MakeAdminOptions = {
  initialQueryData?: Array<{ id: string; email: string }>;
  initialQueryError?: object | null;
  secondaryQueryData?: { id: string; email: string } | null;
  generateLinkData?: { user: { id: string }; properties: { email_otp: string } } | null;
  generateLinkError?: { message: string; status: number } | null;
};

const makeAdmin = (opts: MakeAdminOptions = {}) => {
  const emailLookupBuilder = {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockResolvedValue({
      data: opts.initialQueryData ?? [],
      error: opts.initialQueryError ?? null
    }),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: opts.secondaryQueryData ?? null,
      error: null
    })
  };

  const generateLinkMock = vi.fn().mockResolvedValue({
    data:
      opts.generateLinkData !== undefined
        ? opts.generateLinkData
        : { user: { id: 'new-user-id' }, properties: { email_otp: 'otp-123' } },
    error: opts.generateLinkError ?? null
  });

  const mockAdmin = {
    from: vi.fn(() => emailLookupBuilder),
    auth: { admin: { generateLink: generateLinkMock } }
  } as unknown as ReturnType<typeof createAdminClient>;

  return { mockAdmin, emailLookupBuilder, generateLinkMock };
};

describe('resolveCopresenters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty lists when no co-presenters are provided', async () => {
    const { mockAdmin } = makeAdmin();
    const result = await resolveCopresenters([], mockAdmin, 'test', SUBMITTER_ID, PRESENTATION_ID);
    expect(result).toEqual({ success: true, existingPresenters: [], newPresenters: [] });
  });

  it('normalises input emails to lowercase before issuing the ilike query', async () => {
    const { mockAdmin, emailLookupBuilder } = makeAdmin({
      initialQueryData: [{ id: 'user-1', email: 'alice@example.com' }]
    });

    await resolveCopresenters(
      ['ALICE@EXAMPLE.COM'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(emailLookupBuilder.or).toHaveBeenCalledWith('email.ilike.alice@example.com');
  });

  it('treats a user returned by the initial query as an existing presenter', async () => {
    const { mockAdmin } = makeAdmin({
      // Simulates email_lookup storing mixed-case email while input is lowercase
      initialQueryData: [{ id: 'user-1', email: 'Jason34@test.email' }]
    });

    const result = await resolveCopresenters(
      ['jason34@test.email'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.existingPresenters).toHaveLength(1);
    expect(result.existingPresenters[0].id).toBe('user-1');
    expect(result.newPresenters).toHaveLength(0);
  });

  it('does not attempt account creation for emails found by the initial query', async () => {
    const { mockAdmin, generateLinkMock } = makeAdmin({
      initialQueryData: [{ id: 'user-1', email: 'alice@example.com' }]
    });

    await resolveCopresenters(
      ['alice@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(generateLinkMock).not.toHaveBeenCalled();
  });

  it('creates a new account when email is not in email_lookup', async () => {
    const { mockAdmin } = makeAdmin({ initialQueryData: [] });

    const result = await resolveCopresenters(
      ['new@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.newPresenters).toHaveLength(1);
    expect(result.newPresenters[0].id).toBe('new-user-id');
    expect(result.existingPresenters).toHaveLength(0);
  });

  it('recovers an already-registered user via secondary ilike lookup instead of dropping them', async () => {
    const { mockAdmin } = makeAdmin({
      initialQueryData: [],
      generateLinkError: { message: 'User already registered', status: 422 },
      generateLinkData: null,
      secondaryQueryData: { id: 'user-existing', email: 'alice@example.com' }
    });

    const result = await resolveCopresenters(
      ['alice@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.existingPresenters).toHaveLength(1);
    expect(result.existingPresenters[0].id).toBe('user-existing');
    expect(result.newPresenters).toHaveLength(0);
  });

  it('attaches an inviteUrl to each resolved existing presenter', async () => {
    const { mockAdmin } = makeAdmin({
      initialQueryData: [{ id: 'user-1', email: 'alice@example.com' }]
    });

    const result = await resolveCopresenters(
      ['alice@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.existingPresenters[0].inviteUrl).toBe(
      `/copresenter-invite/${PRESENTATION_ID}:user-1`
    );
  });

  it('mixes existing and new presenters in the same call', async () => {
    const { mockAdmin } = makeAdmin({
      initialQueryData: [{ id: 'existing-id', email: 'existing@example.com' }]
    });

    const result = await resolveCopresenters(
      ['existing@example.com', 'brand-new@example.com'],
      mockAdmin,
      'test',
      SUBMITTER_ID,
      PRESENTATION_ID
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.existingPresenters).toHaveLength(1);
    expect(result.existingPresenters[0].id).toBe('existing-id');
    expect(result.newPresenters).toHaveLength(1);
    expect(result.newPresenters[0].id).toBe('new-user-id');
  });
});

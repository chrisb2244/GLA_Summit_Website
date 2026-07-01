import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { logToDb } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabaseClient';
import { sendMailApi } from '@/lib/sendMail';
import {
  ACCEPTED_EMAIL_SUBJECT,
  REJECTED_EMAIL_SUBJECT
} from '@/EmailTemplates/PresentationOutcomeEmail';

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

vi.mock('@/lib/supabaseClient', () => ({
  createAdminClient: vi.fn()
}));

vi.mock('@/lib/sendMail', () => ({
  sendMailApi: vi.fn()
}));

const SECRET = 'test-secret';

const buildRequest = (
  body: unknown,
  { secret = SECRET }: { secret?: string | null } = {}
) =>
  new Request('http://localhost/api/submission-outcome', {
    method: 'POST',
    headers: secret === null ? {} : { 'x-submission-outcome-secret': secret },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }) as unknown as Parameters<typeof POST>[0];

// Minimal chainable Supabase mock: every method returns the same chain, which is
// thenable (and .single()-able) resolving to the configured per-table result.
const makeChain = (result: unknown) => {
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  chain.select = passthrough;
  chain.eq = passthrough;
  chain.in = passthrough;
  chain.single = () => Promise.resolve(result);
  chain.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
};

const mockAdminClient = (
  overrides: Record<string, unknown> = {}
) => {
  const results: Record<string, unknown> = {
    presentation_submissions: { data: { title: 'My Talk' } },
    presentation_presenters: {
      data: [{ presenter_id: 'p1' }, { presenter_id: 'p2' }]
    },
    email_lookup: {
      data: [
        { id: 'p1', email: 'alice@example.com' },
        { id: 'p2', email: 'bob@example.com' }
      ]
    },
    profiles: {
      data: [
        { id: 'p1', firstname: 'Alice' },
        { id: 'p2', firstname: 'Bob' }
      ]
    },
    ...overrides
  };
  const from = vi.fn((table: string) => makeChain(results[table]));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from };
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SECRET_SUBMISSION_OUTCOME_TOKEN = SECRET;
  vi.mocked(sendMailApi).mockResolvedValue({ status: 200, message: 'ok' } as never);
  mockAdminClient();
});

describe('POST /api/submission-outcome', () => {
  it('returns 503 when the secret is not configured', async () => {
    delete process.env.SECRET_SUBMISSION_OUTCOME_TOKEN;
    const res = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' })
    );
    expect(res.status).toBe(503);
    expect(sendMailApi).not.toHaveBeenCalled();
  });

  it('rejects a missing or mismatched secret with 401', async () => {
    const missing = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' }, { secret: null })
    );
    expect(missing.status).toBe(401);

    const wrong = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' }, { secret: 'nope' })
    );
    expect(wrong.status).toBe(401);
    expect(sendMailApi).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid JSON body', async () => {
    const res = await POST(buildRequest('not json{'));
    expect(res.status).toBe(400);
    expect(sendMailApi).not.toHaveBeenCalled();
  });

  it('emails every presenter with the accepted template on an accepted outcome', async () => {
    const res = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(sendMailApi).toHaveBeenCalledTimes(2);
    const recipients = vi
      .mocked(sendMailApi)
      .mock.calls.map(([arg]) => arg.to);
    expect(recipients).toEqual(
      expect.arrayContaining(['alice@example.com', 'bob@example.com'])
    );
    for (const [arg] of vi.mocked(sendMailApi).mock.calls) {
      expect(arg.subject).toBe(ACCEPTED_EMAIL_SUBJECT);
      expect(arg.body).toContain('My Talk');
    }
  });

  it('emails every presenter with the rejected template on a declined outcome', async () => {
    await POST(buildRequest({ presentation_id: 'pres-1', outcome: 'declined' }));
    expect(sendMailApi).toHaveBeenCalledTimes(2);
    for (const [arg] of vi.mocked(sendMailApi).mock.calls) {
      expect(arg.subject).toBe(REJECTED_EMAIL_SUBJECT);
    }
  });

  it('logs a severe, non-expiring entry when an email fails to send', async () => {
    vi.mocked(sendMailApi).mockResolvedValue({ status: 500, message: 'boom' } as never);
    await POST(buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' }));

    const severeCalls = vi
      .mocked(logToDb)
      .mock.calls.filter(([severity]) => severity === 'severe');
    expect(severeCalls.length).toBeGreaterThan(0);
    // No retainDays => never expires.
    for (const call of severeCalls) {
      const options = call[3] as { retainDays?: number } | undefined;
      expect(options?.retainDays).toBeUndefined();
    }
  });

  it('logs severe when a presenter has no email address', async () => {
    mockAdminClient({ email_lookup: { data: [{ id: 'p1', email: 'alice@example.com' }] } });
    await POST(buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' }));

    expect(sendMailApi).toHaveBeenCalledTimes(1);
    const severeCalls = vi
      .mocked(logToDb)
      .mock.calls.filter(([severity]) => severity === 'severe');
    expect(severeCalls.length).toBeGreaterThan(0);
  });
});

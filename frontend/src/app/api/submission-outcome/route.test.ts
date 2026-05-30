import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { logToDb } from '@/lib/utils';

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SECRET_SUBMISSION_OUTCOME_TOKEN = SECRET;
});

describe('POST /api/submission-outcome', () => {
  it('returns 503 when the secret is not configured', async () => {
    delete process.env.SECRET_SUBMISSION_OUTCOME_TOKEN;
    const res = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'accepted' })
    );
    expect(res.status).toBe(503);
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
  });

  it('returns 400 for an invalid JSON body', async () => {
    const res = await POST(buildRequest('not json{'));
    expect(res.status).toBe(400);
  });

  it('accepts a valid outcome and logs it (no-op happy path)', async () => {
    const res = await POST(
      buildRequest({ presentation_id: 'pres-1', outcome: 'declined' })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(logToDb).toHaveBeenCalledWith(
      'info',
      'Submission outcome notified',
      'api/submission-outcome',
      { context: { presentationId: 'pres-1', outcome: 'declined' } }
    );
  });
});

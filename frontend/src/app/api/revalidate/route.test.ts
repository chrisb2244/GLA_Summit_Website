import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { revalidateTag } from 'next/cache';
import { createAdminClient } from '@/lib/supabaseClient';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

vi.mock('@/lib/supabaseClient', () => ({
  createAdminClient: vi.fn()
}));

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

const SECRET = 'test-secret';

const buildRequest = (
  body: unknown,
  { secret = SECRET }: { secret?: string | null } = {}
) =>
  new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: secret === null ? {} : { 'x-revalidate-secret': secret },
    body: typeof body === 'string' ? body : JSON.stringify(body)
    // The route only uses request.headers.get / request.json, which Request supports.
  }) as unknown as Parameters<typeof POST>[0];

/** Mock the admin client's presentation_presenters lookup. */
const mockPresenters = (presenterIds: string[]) => {
  const eq = vi.fn().mockResolvedValue({
    data: presenterIds.map((presenter_id) => ({ presenter_id })),
    error: null
  });
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, select, eq };
};

const revalidatedTags = () =>
  vi.mocked(revalidateTag).mock.calls.map(([tag]) => tag);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SECRET_REVALIDATE_TOKEN = SECRET;
});

describe('POST /api/revalidate', () => {
  it('returns 503 when the secret is not configured', async () => {
    delete process.env.SECRET_REVALIDATE_TOKEN;
    const res = await POST(buildRequest({ table: 'video_links' }));
    expect(res.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a missing or mismatched secret with 401', async () => {
    const missing = await POST(
      buildRequest({ table: 'video_links' }, { secret: null })
    );
    expect(missing.status).toBe(401);

    const wrong = await POST(
      buildRequest({ table: 'video_links' }, { secret: 'nope' })
    );
    expect(wrong.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid JSON body', async () => {
    const res = await POST(buildRequest('not json{'));
    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('revalidates the video tag for a video_links change', async () => {
    const res = await POST(
      buildRequest({
        type: 'UPDATE',
        schema: 'public',
        table: 'video_links',
        record: { presentation_id: 'pres-1', url: 'https://x' },
        old_record: null
      })
    );

    expect(res.status).toBe(200);
    expect(revalidatedTags()).toEqual(['presentation-video:pres-1']);
    // No presenter lookup needed for video links.
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('revalidates presentation, year, agenda, accepted-ids and presenter tags on acceptance', async () => {
    mockPresenters(['presenter-a', 'presenter-b']);

    const res = await POST(
      buildRequest({
        type: 'INSERT',
        schema: 'public',
        table: 'accepted_presentations',
        record: { id: 'pres-1', year: '2026', scheduled_for: null },
        old_record: null
      })
    );

    expect(res.status).toBe(200);
    expect(new Set(revalidatedTags())).toEqual(
      new Set([
        'presentation:pres-1',
        'agenda:current',
        'presenters:accepted-ids',
        'presentations:2026',
        'presenters:accepted-ids:2026',
        'presenter-presentations:presenter-a',
        'presenter-presentations:presenter-b'
      ])
    );
  });

  it('uses old_record on a DELETE (un-acceptance) and still revalidates presenters', async () => {
    mockPresenters(['presenter-a']);

    const res = await POST(
      buildRequest({
        type: 'DELETE',
        schema: 'public',
        table: 'accepted_presentations',
        record: null,
        old_record: { id: 'pres-1', year: '2025', scheduled_for: null }
      })
    );

    expect(res.status).toBe(200);
    const tags = revalidatedTags();
    expect(tags).toContain('presentations:2025');
    expect(tags).toContain('presenter-presentations:presenter-a');
  });

  it('omits the year tags when the year is not a valid SummitYear', async () => {
    mockPresenters([]);

    await POST(
      buildRequest({
        type: 'UPDATE',
        schema: 'public',
        table: 'accepted_presentations',
        record: { id: 'pres-1', year: '1999', scheduled_for: '2026-01-01' },
        old_record: { id: 'pres-1', year: '1999', scheduled_for: null }
      })
    );

    const tags = revalidatedTags();
    expect(tags).not.toContain('presentations:1999');
    expect(tags).not.toContain('presenters:accepted-ids:1999');
    expect(tags).toContain('presentation:pres-1');
  });

  it('returns revalidated:false for an unknown table', async () => {
    const res = await POST(
      buildRequest({
        type: 'INSERT',
        schema: 'public',
        table: 'some_other_table',
        record: { id: 'x' },
        old_record: null
      })
    );

    const body = await res.json();
    expect(body.revalidated).toBe(false);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

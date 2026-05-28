import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MockInstance } from 'vitest';

vi.mock('next/og', () => ({
  ImageResponse: vi.fn()
}));

vi.mock('@/app/configConstants', () => ({
  ticketYear: '2026',
  startDate: new Date(Date.UTC(2026, 7, 31, 12, 0, 0)) // 31 Aug 2026 12:00 UTC
}));

import { ImageResponse } from 'next/og';
import { GET } from './route';

const MockImageResponse = ImageResponse as unknown as MockInstance;

describe('GET /api/og', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockImageResponse.mockReturnValue({ status: 200 });
  });

  it('returns an ImageResponse', async () => {
    const request = new Request('http://localhost/api/og');
    const result = await GET(request as never);
    expect(result).toBeDefined();
    expect(MockImageResponse).toHaveBeenCalledOnce();
  });

  it('uses 1200×630 dimensions', async () => {
    const request = new Request('http://localhost/api/og');
    await GET(request as never);

    const [, options] = MockImageResponse.mock.calls[0];
    expect(options.width).toBe(1200);
    expect(options.height).toBe(630);
  });

  it('passes Roboto-Bold font at weight 700', async () => {
    const request = new Request('http://localhost/api/og');
    await GET(request as never);

    const [, options] = MockImageResponse.mock.calls[0];
    const fonts: Array<{ name: string; weight: number; style: string; data: ArrayBuffer }> =
      options.fonts;
    expect(fonts).toHaveLength(1);
    expect(fonts[0].name).toBe('Roboto-Bold');
    expect(fonts[0].weight).toBe(700);
    expect(fonts[0].style).toBe('normal');
    // Node.js Buffer.buffer may differ from the jsdom ArrayBuffer class, so check duck-typing
    expect(fonts[0].data).toHaveProperty('byteLength');
    expect((fonts[0].data as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });

  it('formats the date in US locale with full month name', async () => {
    const request = new Request('http://localhost/api/og');
    await GET(request as never);

    const [element] = MockImageResponse.mock.calls[0];
    const jsx = JSON.stringify(element);
    // startDate is 31 Aug 2026 → "August 31, 2026"
    expect(jsx).toContain('August 31, 2026');
  });

  it('includes "GLA Summit 2026" as a single string in the heading', async () => {
    const request = new Request('http://localhost/api/og');
    await GET(request as never);

    const [element] = MockImageResponse.mock.calls[0];
    const jsx = JSON.stringify(element);
    expect(jsx).toContain('GLA Summit 2026');
  });

  it('encodes the logo as a base64 data URI for the img element', async () => {
    const request = new Request('http://localhost/api/og');
    await GET(request as never);

    const [element] = MockImageResponse.mock.calls[0];
    const jsx = JSON.stringify(element);
    expect(jsx).toContain('data:image/svg+xml;base64,');
  });
});

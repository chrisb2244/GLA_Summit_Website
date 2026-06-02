import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MockInstance } from 'vitest';

vi.mock('next/og', () => ({
  ImageResponse: vi.fn()
}));

vi.mock('@/app/configConstants', () => ({
  summitStartDates: {
    '2020': new Date(Date.UTC(2020, 10, 9, 12, 0, 0)),
    '2021': new Date(Date.UTC(2021, 10, 15, 12, 0, 0)),
    '2022': new Date(Date.UTC(2022, 10, 14, 12, 0, 0)),
    '2024': new Date(Date.UTC(2024, 2, 25, 12, 0, 0)),
    '2025': new Date(Date.UTC(2025, 5, 23, 12, 0, 0)),
    '2026': new Date(Date.UTC(2026, 7, 31, 12, 0, 0))
  }
}));

vi.mock('@/lib/databaseModels', () => ({
  isSummitYear: (year: string) =>
    ['2020', '2021', '2022', '2024', '2025', '2026'].includes(year)
}));

import { ImageResponse } from 'next/og';
import { GET, generateStaticParams } from './route';

const MockImageResponse = ImageResponse as unknown as MockInstance;

function makeParams(year: string) {
  return { params: Promise.resolve({ year }) };
}

describe('generateStaticParams', () => {
  it('pre-renders all known summit years', () => {
    const params = generateStaticParams();
    const years = params.map((p) => p.year).sort();
    expect(years).toEqual(['2020', '2021', '2022', '2024', '2025', '2026']);
  });
});

describe('GET /api/og/[year]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockImageResponse.mockImplementation(function () { return { status: 200 }; });
  });

  it('returns 404 for an unknown year', async () => {
    const request = new Request('http://localhost/api/og/1999');
    const result = await GET(request as never, makeParams('1999'));
    expect((result as Response).status).toBe(404);
    expect(MockImageResponse).not.toHaveBeenCalled();
  });

  it('returns an ImageResponse for a known year', async () => {
    const request = new Request('http://localhost/api/og/2026');
    const result = await GET(request as never, makeParams('2026'));
    expect(result).toBeDefined();
    expect(MockImageResponse).toHaveBeenCalledOnce();
  });

  it('uses 1200×630 dimensions', async () => {
    await GET(new Request('http://localhost/api/og/2026') as never, makeParams('2026'));
    const [, options] = MockImageResponse.mock.calls[0];
    expect(options.width).toBe(1200);
    expect(options.height).toBe(630);
  });

  it('passes Roboto-Bold font at weight 700 with real font data', async () => {
    await GET(new Request('http://localhost/api/og/2026') as never, makeParams('2026'));
    const [, options] = MockImageResponse.mock.calls[0];
    const fonts: Array<{ name: string; weight: number; style: string; data: ArrayBuffer }> =
      options.fonts;
    expect(fonts).toHaveLength(1);
    expect(fonts[0].name).toBe('Roboto-Bold');
    expect(fonts[0].weight).toBe(700);
    expect(fonts[0].style).toBe('normal');
    expect(fonts[0].data).toHaveProperty('byteLength');
    expect((fonts[0].data as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });

  it('uses the year param in the heading', async () => {
    await GET(new Request('http://localhost/api/og/2026') as never, makeParams('2026'));
    const [element] = MockImageResponse.mock.calls[0];
    expect(JSON.stringify(element)).toContain('GLA Summit 2026');
  });

  it('shows the correct date for 2026 (August 31, 2026)', async () => {
    await GET(new Request('http://localhost/api/og/2026') as never, makeParams('2026'));
    const [element] = MockImageResponse.mock.calls[0];
    expect(JSON.stringify(element)).toContain('August 31, 2026');
  });

  it('shows the correct date for 2020 (November 9, 2020)', async () => {
    await GET(new Request('http://localhost/api/og/2020') as never, makeParams('2020'));
    const [element] = MockImageResponse.mock.calls[0];
    expect(JSON.stringify(element)).toContain('November 9, 2020');
  });

  it('shows the correct date for 2024 (March 25, 2024)', async () => {
    await GET(new Request('http://localhost/api/og/2024') as never, makeParams('2024'));
    const [element] = MockImageResponse.mock.calls[0];
    expect(JSON.stringify(element)).toContain('March 25, 2024');
  });

  it('encodes the logo as a base64 data URI', async () => {
    await GET(new Request('http://localhost/api/og/2026') as never, makeParams('2026'));
    const [element] = MockImageResponse.mock.calls[0];
    expect(JSON.stringify(element)).toContain('data:image/svg+xml;base64,');
  });
});

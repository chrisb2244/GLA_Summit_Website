import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, isReportable, type NormalisedReport } from './route';
import { logToDb } from '@/lib/utils';

// `after` defers the DB writes past the response; run its callback inline so the
// (mocked) logToDb call is observable synchronously in the single-report tests.
vi.mock('next/server', () => ({
  after: vi.fn((cb: () => unknown) => cb())
}));

vi.mock('@/lib/utils', () => ({
  logToDb: vi.fn()
}));

const buildRequest = (body: unknown) =>
  new Request('http://localhost/api/csp-report', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body)
  }) as unknown as Parameters<typeof POST>[0];

/** A NormalisedReport with everything null but the fields under test. */
const report = (fields: Partial<NormalisedReport>): NormalisedReport => ({
  documentUri: null,
  violatedDirective: null,
  effectiveDirective: null,
  blockedUri: null,
  sourceFile: null,
  lineNumber: null,
  scriptSample: null,
  disposition: null,
  ...fields
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isReportable', () => {
  it.each([
    // Extension-injected violations — unactionable, filtered out.
    {
      label: 'chrome-extension in blockedUri',
      fields: { blockedUri: 'chrome-extension://abc/inject.js' },
      expected: false
    },
    {
      label: 'moz-extension in sourceFile',
      fields: { sourceFile: 'moz-extension://x/content.js' },
      expected: false
    },
    {
      label: 'safari-extension in blockedUri',
      fields: { blockedUri: 'safari-extension://x/content.js' },
      expected: false
    },
    {
      label: 'safari-web-extension in blockedUri',
      fields: { blockedUri: 'safari-web-extension://x/content.js' },
      expected: false
    },
    // Inert pseudo-schemes, anchored to a boundary.
    {
      label: 'about:blank',
      fields: { blockedUri: 'about:blank' },
      expected: false
    },
    {
      label: 'data:text/html',
      fields: { blockedUri: 'data:text/html,<script>x</script>' },
      expected: false
    },
    // Genuine, site-caused violations — kept.
    {
      label: 'real cross-origin script',
      fields: {
        blockedUri: 'https://va.vercel-scripts.com/s.js',
        sourceFile: 'https://glasummit.org/'
      },
      expected: true
    },
    {
      label: 'inline violation',
      fields: { blockedUri: 'inline' },
      expected: true
    },
    {
      label: 'about: inside a real URL query string is not a false positive',
      fields: { blockedUri: 'https://x.com/?next=about:blank' },
      expected: true
    }
  ])('$label -> $expected', ({ fields, expected }) => {
    expect(isReportable(report(fields))).toBe(expected);
  });
});

describe('POST /api/csp-report', () => {
  it('logs a report-to (Reporting API) violation, normalising camelCase fields', async () => {
    const res = await POST(
      buildRequest([
        {
          type: 'csp-violation',
          url: 'https://glasummit.org/agenda',
          body: {
            documentURL: 'https://glasummit.org/agenda',
            violatedDirective: 'script-src-elem',
            effectiveDirective: 'script-src-elem',
            blockedURL: 'https://evil.example.com/x.js',
            sourceFile: 'https://glasummit.org/agenda',
            lineNumber: 12,
            sample: '',
            disposition: 'report'
          }
        }
      ])
    );

    expect(res.status).toBe(204);
    expect(logToDb).toHaveBeenCalledTimes(1);
    expect(logToDb).toHaveBeenCalledWith(
      'info',
      'CSP violation',
      'api/csp-report',
      {
        retainDays: 30,
        context: expect.objectContaining({
          documentUri: 'https://glasummit.org/agenda',
          effectiveDirective: 'script-src-elem',
          blockedUri: 'https://evil.example.com/x.js',
          lineNumber: 12
        })
      }
    );
  });

  it('logs a report-uri (legacy) violation, normalising kebab-case fields', async () => {
    const res = await POST(
      buildRequest({
        'csp-report': {
          'document-uri': 'https://glasummit.org/',
          'violated-directive': "img-src 'self'",
          'effective-directive': 'img-src',
          'blocked-uri': 'https://tracker.example.com/p.gif',
          'source-file': 'https://glasummit.org/',
          'line-number': 1,
          'script-sample': '',
          disposition: 'report'
        }
      })
    );

    expect(res.status).toBe(204);
    expect(logToDb).toHaveBeenCalledTimes(1);
    expect(logToDb).toHaveBeenCalledWith(
      'info',
      'CSP violation',
      'api/csp-report',
      {
        retainDays: 30,
        context: expect.objectContaining({
          documentUri: 'https://glasummit.org/',
          effectiveDirective: 'img-src',
          blockedUri: 'https://tracker.example.com/p.gif'
        })
      }
    );
  });

  it('drops extension noise without logging', async () => {
    const res = await POST(
      buildRequest({
        'csp-report': { 'blocked-uri': 'chrome-extension://abc/inject.js' }
      })
    );

    expect(res.status).toBe(204);
    expect(logToDb).not.toHaveBeenCalled();
  });

  it('answers 204 and logs nothing for a malformed body', async () => {
    const res = await POST(buildRequest('not json{'));

    expect(res.status).toBe(204);
    expect(logToDb).not.toHaveBeenCalled();
  });
});

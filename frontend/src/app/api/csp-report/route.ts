import { after, type NextRequest } from 'next/server';
import { logToDb } from '@/lib/utils';

/**
 * Collector for Content-Security-Policy violation reports.
 *
 * Wired from `next.config.ts` via two directives, because the delivery
 * mechanisms have disjoint browser support:
 *   - `report-uri`  → Firefox & Safari (legacy, still the only option there).
 *     Body: `application/csp-report`, a single `{ "csp-report": {...} }`.
 *   - `report-to`   → Chromium (Reporting API, named by the
 *     `Reporting-Endpoints` response header). Body: `application/reports+json`,
 *     an array of `{ type, url, body }` envelopes.
 * Browsers that support `report-to` use it and ignore `report-uri`, so reports
 * are not duplicated. Both formats are normalised to one shape below.
 *
 * The endpoint is unauthenticated by nature (the browser posts here with no
 * credentials and we cannot add a secret), so it is treated as untrusted:
 * payload size is capped, malformed bodies are dropped, obvious browser-
 * extension noise is filtered, and rows are written with a retention cap.
 */

/** Reject bodies larger than this (defends the log table from flooding). */
const MAX_BODY_BYTES = 16_384;
/** Days to keep CSP report rows — they are high-volume and low long-term value. */
const REPORT_RETAIN_DAYS = 30;

/** Common shape we log, regardless of source wire format. */
export type NormalisedReport = {
  documentUri: string | null;
  violatedDirective: string | null;
  effectiveDirective: string | null;
  blockedUri: string | null;
  sourceFile: string | null;
  lineNumber: number | null;
  scriptSample: string | null;
  disposition: string | null;
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  // Always answer 204 — report collectors should never make the browser retry.
  const noContent = new Response(null, { status: 204 });

  if (body.length === 0 || body.length > MAX_BODY_BYTES) {
    return noContent;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return noContent;
  }

  const reports = normalise(parsed).filter(isReportable);

  // Persist after the 204 is sent — these are admin-client DB round-trips that
  // the browser's report delivery neither waits for nor cares about, so they
  // should not delay the response.
  if (reports.length > 0) {
    after(async () => {
      for (const report of reports) {
        await logToDb('info', 'CSP violation', 'api/csp-report', {
          context: report,
          retainDays: REPORT_RETAIN_DAYS
        });
      }
    });
  }

  return noContent;
}

/** Map either wire format into zero or more normalised reports. */
const normalise = (parsed: unknown): NormalisedReport[] => {
  // Reporting API (`report-to`): an array of envelopes whose `body` is the
  // violation, using camelCase field names.
  if (Array.isArray(parsed)) {
    return parsed
      .filter(
        (entry): entry is { type?: string; body?: Record<string, unknown> } =>
          typeof entry === 'object' && entry !== null
      )
      .filter(
        (entry) => entry.type === undefined || entry.type === 'csp-violation'
      )
      .map((entry) => fromCamelCase(entry.body ?? {}));
  }

  // Legacy `report-uri`: a single `{ "csp-report": {...} }`, kebab-case fields.
  if (typeof parsed === 'object' && parsed !== null && 'csp-report' in parsed) {
    const report = (parsed as { 'csp-report'?: Record<string, unknown> })[
      'csp-report'
    ];
    if (report) {
      return [fromKebabCase(report)];
    }
  }

  return [];
};

const fromKebabCase = (r: Record<string, unknown>): NormalisedReport => ({
  documentUri: str(r['document-uri']),
  violatedDirective: str(r['violated-directive']),
  effectiveDirective: str(r['effective-directive']),
  blockedUri: str(r['blocked-uri']),
  sourceFile: str(r['source-file']),
  lineNumber: num(r['line-number']),
  scriptSample: str(r['script-sample']),
  disposition: str(r['disposition'])
});

const fromCamelCase = (r: Record<string, unknown>): NormalisedReport => ({
  documentUri: str(r['documentURL']),
  violatedDirective: str(r['violatedDirective']),
  effectiveDirective: str(r['effectiveDirective']),
  blockedUri: str(r['blockedURL']),
  sourceFile: str(r['sourceFile']),
  lineNumber: num(r['lineNumber']),
  scriptSample: str(r['sample']),
  disposition: str(r['disposition'])
});

/**
 * Drop reports caused by browser extensions / injected content rather than the
 * site itself — these are unactionable and otherwise dominate the volume.
 */
export const isReportable = (r: NormalisedReport): boolean => {
  const haystack = `${r.blockedUri ?? ''} ${r.sourceFile ?? ''}`;
  // Match the extension scheme whether it carries an authority
  // (`chrome-extension://hash/...`) or arrives as the bare scheme that some
  // Chromium reports anonymise it to (`chrome-extension`, no colon). The
  // `(?=[:\s]|$)` lookahead accepts the colon, a token break, or end-of-string
  // while still rejecting a substring match inside a real URL path such as
  // `/chrome-extension-guide`. The `\b` / `\s` anchors likewise keep
  // `about:`/`data:` from matching those substrings inside a real URL.
  return !/\b(?:chrome|moz|safari(?:-web)?)-extension(?=[:\s]|$)|(?:^|\s)(?:about|data):/i.test(
    haystack
  );
};

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v.slice(0, 2048) : null;

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

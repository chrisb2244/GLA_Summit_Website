import type { NextRequest } from 'next/server';
import { logToDb } from '@/lib/utils';

/**
 * Notification hook for automated submission outcomes (accept / decline).
 *
 * When organizer votes reach an accept or decline threshold, the
 * `evaluate_submission_votes` database trigger writes the outcome row
 * (accepted_presentations / rejected_presentations) and POSTs the outcome here
 * so the app can run server-side side-effects (e.g. notification emails) that a
 * database trigger cannot. The durable state change happens in the database; this
 * route is a best-effort follow-up and is currently a **no-op placeholder**.
 *
 * Authenticated with a shared secret (`SECRET_SUBMISSION_OUTCOME_TOKEN`) sent in
 * the `x-submission-outcome-secret` header, configured on the trigger's Vault
 * secret. Mirrors the auth shape of `/api/revalidate`.
 */

/** Header carrying the shared secret. Must match the trigger configuration. */
const SECRET_HEADER = 'x-submission-outcome-secret';

/** The payload the database trigger sends. */
type OutcomePayload = {
  presentation_id: string;
  outcome: 'accepted' | 'declined';
};

export async function POST(request: NextRequest) {
  const expected = process.env.SECRET_SUBMISSION_OUTCOME_TOKEN;
  if (!expected) {
    // Fail closed: without a configured secret we cannot authenticate callers.
    await logToDb(
      'error',
      'Submission-outcome webhook called but SECRET_SUBMISSION_OUTCOME_TOKEN is unset',
      'api/submission-outcome'
    );
    return Response.json(
      { ok: false, message: 'Submission outcome handling is not configured' },
      { status: 503 }
    );
  }

  const provided = request.headers.get(SECRET_HEADER);
  if (!provided || provided !== expected) {
    return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  let payload: OutcomePayload;
  try {
    payload = (await request.json()) as OutcomePayload;
  } catch {
    return Response.json(
      { ok: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // No-op for now: record that the hook fired so we can observe it. Future
  // server-side behaviour (notification emails etc.) hangs off this point.
  await logToDb(
    'info',
    'Submission outcome notified',
    'api/submission-outcome',
    {
      context: {
        presentationId: payload?.presentation_id ?? null,
        outcome: payload?.outcome ?? null
      }
    }
  );

  return Response.json({ ok: true });
}

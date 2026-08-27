import { after, type NextRequest } from 'next/server';
import { joinNames, logToDb } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabaseClient';
import { sendMailApi } from '@/lib/sendMail';
import {
  ACCEPTED_EMAIL_SUBJECT,
  AcceptedPresentationEmailFn,
  REJECTED_EMAIL_SUBJECT,
  RejectedPresentationEmailFn
} from '@/EmailTemplates/PresentationOutcomeEmail';

/**
 * Notification hook for submission outcomes (accept / decline).
 *
 * When a submission reaches an outcome — either the organizer-vote threshold or
 * an organizer-forced early conclusion — the `apply_submission_outcome` database
 * function writes the outcome row (accepted_presentations / rejected_presentations)
 * and POSTs the outcome here so the app can run server-side side-effects that a
 * database trigger cannot. The durable state change happens in the database; this
 * route is a best-effort follow-up that emails every presenter the outcome.
 *
 * The emails are dispatched via `after()`, i.e. after the response is sent, so the
 * route acknowledges within the caller's `net.http_post` timeout regardless of how
 * many presenters there are or how slow the mail provider is. A 200 therefore means
 * "outcome notification accepted", not "emails delivered" — delivery is best-effort
 * and failures are recorded via `logToDb('severe', …)` rather than surfaced here.
 *
 * Authenticated with a shared secret (`SECRET_SUBMISSION_OUTCOME_TOKEN`) sent in
 * the `x-submission-outcome-secret` header, configured on the trigger's Vault
 * secret. Mirrors the auth shape of `/api/revalidate`. The caller is the database
 * (no user session), so lookups here use the admin client. `notifyPresenters` is
 * intentionally module-private: it sends mail with no authorization of its own, so
 * the secret-guarded POST must remain its only caller.
 */

/** Header carrying the shared secret. Must match the trigger configuration. */
const SECRET_HEADER = 'x-submission-outcome-secret';

/** The payload the database trigger sends. */
type OutcomePayload = {
  presentation_id: string;
  outcome: 'accepted' | 'declined';
};

/**
 * Email every presenter (submitter + co-presenters) the outcome. Best-effort:
 * failures are logged at high severity and never expire (a presenter may not have
 * learned their outcome), but do not fail the request — the outcome is durable.
 */
const notifyPresenters = async (
  presentationId: string,
  outcome: 'accepted' | 'declined'
) => {
  const supabase = createAdminClient();

  const [{ data: submission }, { data: presenterRows }] = await Promise.all([
    supabase
      .from('presentation_submissions')
      .select('title')
      .eq('id', presentationId)
      .single(),
    supabase
      .from('presentation_presenters')
      .select('presenter_id')
      .eq('presentation_id', presentationId)
  ]);

  if (!submission) {
    await logToDb(
      'severe',
      'Submission outcome email skipped: submission not found',
      'api/submission-outcome',
      { context: { presentationId, outcome } }
    );
    return;
  }

  const presenterIds = (presenterRows ?? []).map((p) => p.presenter_id);
  if (presenterIds.length === 0) {
    await logToDb(
      'severe',
      'Submission outcome email skipped: no presenters found',
      'api/submission-outcome',
      { context: { presentationId, outcome } }
    );
    return;
  }

  const [{ data: emailRows }, { data: profileRows }] = await Promise.all([
    supabase
      .from('account_emails')
      .select('user_id, email')
      .eq('is_primary', true)
      .in('user_id', presenterIds),
    supabase
      .from('profiles')
      .select('id, firstname, lastname')
      .in('id', presenterIds)
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.id, joinNames(p)])
  );

  const buildEmail =
    outcome === 'accepted'
      ? AcceptedPresentationEmailFn
      : RejectedPresentationEmailFn;
  const subject =
    outcome === 'accepted' ? ACCEPTED_EMAIL_SUBJECT : REJECTED_EMAIL_SUBJECT;
  const { title } = submission;

  // Presenters without a primary address cannot be reached; surface that
  // distinctly so it can be chased up.
  const missing = presenterIds.filter(
    (id) => !(emailRows ?? []).some((e) => e.user_id === id)
  );
  if (missing.length > 0) {
    await logToDb(
      'severe',
      'Submission outcome email: presenters missing an email address',
      'api/submission-outcome',
      { context: { presentationId, outcome, missingPresenterIds: missing } }
    );
  }

  await Promise.all(
    (emailRows ?? []).map(async ({ user_id, email }) => {
      const { body, bodyPlain } = buildEmail({
        title,
        recipientName: nameById.get(user_id) ?? ''
      });
      try {
        const result = await sendMailApi({
          to: email,
          subject,
          body,
          bodyPlain
        });
        if (result.status !== 200) {
          await logToDb(
            'severe',
            'Failed to email presenter of submission outcome',
            'api/submission-outcome',
            {
              userId: user_id,
              context: {
                presentationId,
                outcome,
                status: result.status,
                message: result.message
              }
            }
          );
        }
      } catch (err) {
        await logToDb(
          'severe',
          'Failed to email presenter of submission outcome',
          'api/submission-outcome',
          {
            userId: user_id,
            context: {
              presentationId,
              outcome,
              message: err instanceof Error ? err.message : String(err)
            }
          }
        );
      }
    })
  );
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
    return Response.json(
      { ok: false, message: 'Unauthorized' },
      { status: 401 }
    );
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

  // Record that the hook fired (observability), then email the presenters after
  // the response is sent so mail latency/volume can't push the response past the
  // caller's net.http_post timeout.
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

  if (payload?.presentation_id && payload?.outcome) {
    const { presentation_id, outcome } = payload;
    after(() => notifyPresenters(presentation_id, outcome));
  }

  return Response.json({ ok: true });
}

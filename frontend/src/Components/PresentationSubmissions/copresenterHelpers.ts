import { createAdminClient } from '@/lib/supabaseClient';
import { logToDb } from '@/lib/utils';
import { buildValidateLoginUrl } from '@/Components/SigninRegistration/formState';
import { generateInviteToken } from '@/lib/copresenterInviteToken';
import { COPRESENTER_INVITE_WORKFLOW } from '@/app/configConstants';
import { AuthError } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { COPRESENTER_LOOKUP_CLIENT_ERROR } from '../../actions/presentationActionTypes';

export type ExistingPresenter = { id: string; email: string; inviteUrl?: string };
export type NewPresenter = { id: string; email: string; otpCode: string; validateLoginUrl: string };

export type ResolveCopresentersResult =
  | {
      success: true;
      existingPresenters: ExistingPresenter[];
      newPresenters: NewPresenter[];
    }
  | { success: false; error: { message: string } };

/**
 * Looks up which co-presenter emails already have accounts and creates new
 * Supabase auth accounts for those that do not. Returns the resolved lists or
 * an error if the email-lookup query itself fails.
 *
 * Email matching is case-insensitive. If generateLink fails because a user is
 * already registered but wasn't found by the initial lookup (e.g. casing
 * mismatch between what was typed and what email_lookup stores), a secondary
 * lookup recovers them as an existing presenter rather than silently dropping
 * them.
 *
 * New account creation failures (other than already-registered) are logged but
 * do not cause an error return — the function succeeds with the subset that was
 * resolved, matching the original behaviour.
 */
export async function resolveCopresenters(
  otherPresenters: string[],
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  callerName: string,
  submitter_id: string,
  presentationId: string
): Promise<ResolveCopresentersResult> {
  // Normalize to lowercase so the lookup is case-insensitive on the input side.
  const normalizedEmails = otherPresenters.map((e) => e.toLowerCase());
  let existingPresenters: ExistingPresenter[] = [];

  // Invite tokens are only minted when the accept/decline workflow is enabled.
  // While off, co-presenters are implicitly accepted, so there is no invite link
  // (and the token-signing key is intentionally undefined — minting would throw).
  const buildInviteUrl = (presenterId: string): string | undefined =>
    COPRESENTER_INVITE_WORKFLOW
      ? `/copresenter-invite/${generateInviteToken(presentationId, presenterId)}`
      : undefined;

  if (normalizedEmails.length > 0) {
    // Use ilike per email so the lookup is case-insensitive even if email_lookup
    // stores addresses with original casing.
    const { data, error: lookupError } = await supabaseAdmin
      .from('email_lookup')
      .select('id, email')
      .or(normalizedEmails.map((e) => `email.ilike.${e}`).join(','));

    if (lookupError) {
      await logToDb('error', 'Co-presenter email lookup failed', 'submission/copresenter', {
        userId: submitter_id,
        context: {
          caller: callerName,
          message: lookupError.message,
          code: lookupError.code,
          details: lookupError.details,
          hint: lookupError.hint,
          otherPresenterCount: normalizedEmails.length
        }
      });
      return {
        success: false,
        error: { message: COPRESENTER_LOOKUP_CLIENT_ERROR }
      };
    }

    existingPresenters = (data ?? []).map((p) => ({
      ...p,
      inviteUrl: buildInviteUrl(p.id)
    }));
  }

  const foundEmailsNormalized = existingPresenters.map(({ email }) => email.toLowerCase());
  const newPresenterEmails = normalizedEmails.filter(
    (email) => !foundEmailsNormalized.includes(email)
  );

  type CreationResult =
    | { outcome: 'created'; id: string; email: string; otpCode: string; validateLoginUrl: string }
    | { outcome: 'already_exists'; id: string; email: string; inviteUrl?: string }
    | { outcome: 'failed'; error: AuthError };

  const creationResults = await Promise.all(
    newPresenterEmails.map(async (email): Promise<CreationResult> => {
      const randomPassword = randomBytes(32).toString('hex');
      const { data: newUser, error: creationError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'signup',
          email,
          password: randomPassword,
          options: { data: { firstname: '', lastname: '' } }
        });
      if (creationError) {
        // User is in auth.users but not in email_lookup (missing trigger row or
        // casing mismatch that slipped past ilike). Recover via secondary lookup
        // rather than silently dropping the presenter.
        if (creationError.message?.toLowerCase().includes('already registered')) {
          const { data: existing } = await supabaseAdmin
            .from('email_lookup')
            .select('id, email')
            .ilike('email', email)
            .single();
          if (existing) {
            return {
              outcome: 'already_exists' as const,
              id: existing.id,
              email: existing.email,
              inviteUrl: buildInviteUrl(existing.id)
            };
          }
        }
        await logToDb(
          'error',
          'Co-presenter account creation failed',
          'submission/copresenter',
          {
            userId: submitter_id,
            context: {
              caller: callerName,
              message: creationError.message,
              status: creationError.status,
              otherPresenterCount: newPresenterEmails.length
            }
          }
        );
        return { outcome: 'failed' as const, error: creationError };
      }
      const inviteUrl = buildInviteUrl(newUser.user.id);
      return {
        outcome: 'created' as const,
        id: newUser.user.id,
        otpCode: newUser.properties.email_otp,
        validateLoginUrl: buildValidateLoginUrl(email, inviteUrl),
        email
      };
    })
  );

  // Presenters recovered via the already-registered fallback go into existingPresenters
  // so they receive the invite email rather than the new-account email.
  const recoveredExisting = creationResults
    .filter(
      (r): r is Extract<CreationResult, { outcome: 'already_exists' }> =>
        r.outcome === 'already_exists'
    )
    .map(({ id, email, inviteUrl }): ExistingPresenter => ({ id, email, inviteUrl }));
  existingPresenters.push(...recoveredExisting);

  const newPresenters: NewPresenter[] = creationResults.filter(
    (r): r is Extract<CreationResult, { outcome: 'created' }> => r.outcome === 'created'
  );

  return { success: true, existingPresenters, newPresenters };
}

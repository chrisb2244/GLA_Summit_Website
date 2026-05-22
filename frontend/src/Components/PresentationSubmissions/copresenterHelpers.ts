import { createAdminClient } from '@/lib/supabaseClient';
import { logErrorToDb } from '@/lib/utils';
import { AuthError } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { COPRESENTER_LOOKUP_CLIENT_ERROR } from '../../actions/presentationActionTypes';

export type ExistingPresenter = { id: string; email: string };
export type NewPresenter = { id: string; email: string; otpLink: string };

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
 * New account creation failures are logged but do not cause an error return —
 * the function succeeds with the subset of accounts that were created, matching
 * the original behaviour of submitNewPresentation and updateDraftPresentation.
 */
export async function resolveCopresenters(
  otherPresenters: string[],
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  callerName: string,
  submitter_id: string
): Promise<ResolveCopresentersResult> {
  let existingPresenters: ExistingPresenter[] = [];

  if (otherPresenters.length > 0) {
    const { data, error: lookupError } = await supabaseAdmin
      .from('email_lookup')
      .select('id, email')
      .in('email', otherPresenters);

    if (lookupError) {
      await logErrorToDb(
        `${callerName} email_lookup query failed: ${JSON.stringify({
          message: lookupError.message,
          code: lookupError.code,
          details: lookupError.details,
          hint: lookupError.hint,
          otherPresenterCount: otherPresenters.length
        })}`,
        'error',
        submitter_id
      );
      return {
        success: false,
        error: { message: COPRESENTER_LOOKUP_CLIENT_ERROR }
      };
    }

    existingPresenters = data ?? [];
  }

  const foundEmails = existingPresenters.map(({ email }) => email);
  const newPresenterEmails = otherPresenters.filter(
    (email) => !foundEmails.includes(email)
  );

  type CreationResult =
    | { success: true; id: string; email: string; otpLink: string }
    | { success: false; error: AuthError };

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
      if (creationError)
        return { success: false as const, error: creationError };
      return {
        success: true as const,
        id: newUser.user.id,
        otpLink: newUser.properties.email_otp,
        email
      };
    })
  );

  const newPresenters = creationResults.filter((r) => r.success);
  const failedCreations = creationResults.filter((r) => !r.success);
  if (failedCreations.length > 0) {
    console.log({ failedCreations });
  }

  return { success: true, existingPresenters, newPresenters };
}

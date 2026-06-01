'use server';
import 'server-only';

import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { verifyInviteToken } from '@/lib/copresenterInviteToken';
import { sendMailApi } from '@/lib/sendMail';
import { CopresenterResponseNotificationEmailFn } from '@/EmailTemplates/FormSubmissionEmail';
import { logToDb } from '@/lib/utils';
import { COPRESENTER_INVITE_WORKFLOW } from '@/app/configConstants';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/supabase/cacheTags';
import type { SummitYear } from '@/lib/databaseModels';

export type RespondToInviteResult =
  | { success: true; action: 'accept' | 'decline' }
  | { success: false; error: string };

export const submitInviteResponse = async (
  _prev: RespondToInviteResult | null,
  formData: FormData
): Promise<RespondToInviteResult> => {
  const token = formData.get('token');
  const action = formData.get('action');
  if (typeof token !== 'string' || (action !== 'accept' && action !== 'decline')) {
    return { success: false, error: 'Invalid form data.' };
  }
  return respondToInvite(token, action);
};

export const respondToInvite = async (
  token: string,
  action: 'accept' | 'decline'
): Promise<RespondToInviteResult> => {
  // Hard gate: refuse all mutations while the accept/decline workflow is disabled.
  // submitInviteResponse funnels through here, so this covers both server actions.
  if (!COPRESENTER_INVITE_WORKFLOW) {
    return { success: false, error: 'This feature is not currently available.' };
  }

  const payload = verifyInviteToken(token);
  if (!payload) {
    return { success: false, error: 'This invitation link is invalid or has expired.' };
  }

  const supabase = await createServerActionClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to respond to this invitation.' };
  }

  if (user.id !== payload.presenterId) {
    return { success: false, error: 'This invitation is for a different account.' };
  }

  const supabaseAdmin = createAdminClient();

  const { data: currentRow, error: fetchError } = await supabaseAdmin
    .from('presentation_presenters')
    .select('status, declined_count')
    .eq('presentation_id', payload.presentationId)
    .eq('presenter_id', payload.presenterId)
    .single();

  if (fetchError || !currentRow) {
    await logToDb(
      'error',
      'Failed to fetch presenter row for invite response',
      'copresenter-invite/actions',
      {
        userId: user.id,
        context: {
          presentationId: payload.presentationId,
          message: fetchError?.message
        }
      }
    );
    return {
      success: false,
      error: 'Could not find your invitation. Please contact the organizers.'
    };
  }

  // Idempotent: already responded. Report the *stored* decision rather than
  // echoing the attempted action, so an old "accept" link clicked after a
  // decline (or vice-versa) cannot claim a state change that did not happen.
  if (currentRow.status === 'accepted' || currentRow.status === 'declined') {
    return { success: true, action: statusToAction(currentRow.status) };
  }

  const updateData =
    action === 'decline'
      ? { status: 'declined', declined_count: currentRow.declined_count + 1 }
      : { status: 'accepted' };

  // Optimistic-concurrency guard: only transition a row that is still 'pending'.
  // Two concurrent responses (e.g. a double-submit) both read 'pending', but the
  // row lock serialises the writes — the second sees status != 'pending' and
  // matches zero rows, so declined_count cannot be double-incremented.
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('presentation_presenters')
    .update(updateData)
    .eq('presentation_id', payload.presentationId)
    .eq('presenter_id', payload.presenterId)
    .eq('status', 'pending')
    .select('status');

  if (updateError) {
    await logToDb(
      'error',
      'Failed to update presenter status',
      'copresenter-invite/actions',
      {
        userId: user.id,
        context: {
          presentationId: payload.presentationId,
          action,
          message: updateError.message
        }
      }
    );
    return { success: false, error: 'Failed to record your response. Please try again.' };
  }

  if (!updatedRows || updatedRows.length === 0) {
    // Lost the race: a concurrent response already moved the row out of
    // 'pending'. Re-read and report whatever decision actually landed.
    const { data: latest } = await supabaseAdmin
      .from('presentation_presenters')
      .select('status')
      .eq('presentation_id', payload.presentationId)
      .eq('presenter_id', payload.presenterId)
      .single();
    if (latest?.status === 'accepted' || latest?.status === 'declined') {
      return { success: true, action: statusToAction(latest.status) };
    }
    return { success: false, error: 'Failed to record your response. Please try again.' };
  }

  // The public /presenters list is filtered by accepted status and cached for
  // weeks (getAcceptedPresenterIds). An accept/decline changes who appears
  // there, so invalidate that cache — it is otherwise only revalidated when an
  // accepted_presentations row changes, which a status flip does not touch.
  await revalidateAcceptedPresenters(payload.presentationId, supabaseAdmin);

  await notifySubmitter(
    payload.presentationId,
    user.id,
    action,
    supabaseAdmin
  );

  return { success: true, action };
};

const statusToAction = (status: 'accepted' | 'declined'): 'accept' | 'decline' =>
  status === 'accepted' ? 'accept' : 'decline';

const revalidateAcceptedPresenters = async (
  presentationId: string,
  supabaseAdmin: ReturnType<typeof createAdminClient>
) => {
  revalidateTag(CACHE_TAGS.acceptedPresenterIds, { expire: 0 });

  // getAcceptedPresenterIds also attaches a per-year tag when called with a
  // year, so invalidate that variant too in case a year-scoped caller exists.
  const { data: presentation } = await supabaseAdmin
    .from('presentation_submissions')
    .select('year')
    .eq('id', presentationId)
    .single();
  const year = presentation?.year as SummitYear | undefined;
  if (year) {
    revalidateTag(`${CACHE_TAGS.acceptedPresenterIds}:${year}`, { expire: 0 });
  }
};

const notifySubmitter = async (
  presentationId: string,
  copresenterId: string,
  action: 'accept' | 'decline',
  supabaseAdmin: ReturnType<typeof createAdminClient>
) => {
  const { data: presentation } = await supabaseAdmin
    .from('presentation_submissions')
    .select('title, submitter_id')
    .eq('id', presentationId)
    .single();

  if (!presentation) return;

  const [
    { data: submitterEmailRow },
    { data: copresenterProfile },
    { data: copresenterEmailRow }
  ] = await Promise.all([
    supabaseAdmin
      .from('email_lookup')
      .select('email')
      .eq('id', presentation.submitter_id)
      .single(),
    supabaseAdmin
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', copresenterId)
      .single(),
    supabaseAdmin
      .from('email_lookup')
      .select('email')
      .eq('id', copresenterId)
      .single()
  ]);

  if (!submitterEmailRow?.email) return;

  const nameParts = [
    copresenterProfile?.firstname,
    copresenterProfile?.lastname
  ].filter(Boolean);
  const copresenterName =
    nameParts.length > 0
      ? nameParts.join(' ')
      : (copresenterEmailRow?.email ?? 'Unknown');
  const copresenterEmail = copresenterEmailRow?.email ?? '';

  await sendMailApi({
    to: submitterEmailRow.email,
    subject: `GLA Summit: Co-presenter ${action === 'accept' ? 'accepted' : 'declined'} your invitation`,
    ...CopresenterResponseNotificationEmailFn(
      presentation.title,
      copresenterName,
      copresenterEmail,
      action === 'accept',
      `/my-presentations/edit/${presentationId}`
    )
  }).catch((err) => {
    logToDb(
      'error',
      'Failed to send copresenter response notification',
      'copresenter-invite/actions',
      {
        userId: copresenterId,
        context: { presentationId, action, message: String(err) }
      }
    );
  });
};

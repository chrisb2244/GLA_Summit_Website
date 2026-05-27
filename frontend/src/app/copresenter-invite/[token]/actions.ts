'use server';
import 'server-only';

import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { verifyInviteToken } from '@/lib/copresenterInviteToken';
import { sendMailApi } from '@/lib/sendMail';
import { CopresenterResponseNotificationEmailFn } from '@/EmailTemplates/FormSubmissionEmail';
import { logToDb } from '@/lib/utils';
import { COPRESENTER_INVITE_WORKFLOW } from '@/app/configConstants';

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

  // Idempotent: already responded
  if (currentRow.status === 'accepted' || currentRow.status === 'declined') {
    return { success: true, action };
  }

  const updateData =
    action === 'decline'
      ? { status: 'declined', declined_count: currentRow.declined_count + 1 }
      : { status: 'accepted' };

  const { error: updateError } = await supabaseAdmin
    .from('presentation_presenters')
    .update(updateData)
    .eq('presentation_id', payload.presentationId)
    .eq('presenter_id', payload.presenterId);

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

  await notifySubmitter(
    payload.presentationId,
    user.id,
    action,
    supabaseAdmin
  );

  return { success: true, action };
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

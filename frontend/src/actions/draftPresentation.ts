'use server';
import { PresentationSubmissionFormSchema } from '@/Components/Forms/PresentationSubmissionFormSchema';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logErrorToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { resolveCopresenters } from './copresenterHelpers';
import {
  DRAFT_DELETE_CLIENT_ERROR,
  DRAFT_UPDATE_CLIENT_ERROR,
  DeleteReturnType,
  UpdateReturnType
} from './presentationActionTypes';

/**
 * Deletes a draft presentation owned by the current user.
 * RLS enforces ownership (submitter_id = auth.uid()) and draft-only deletion
 * (is_submitted = false), so no explicit ownership check is needed here.
 */
export const deleteDraftPresentation = async (
  presentationId: string
): Promise<DeleteReturnType> => {
  const supabase = await createServerActionClient();

  const { error } = await supabase
    .from('presentation_submissions')
    .delete()
    .eq('id', presentationId);

  if (error) {
    await logErrorToDb(
      `deleteDraftPresentation delete failed: ${JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        presentationId
      })}`,
      'error'
    );
    return { success: false, error: { message: DRAFT_DELETE_CLIENT_ERROR } };
  }

  revalidatePath('/my-presentations');
  revalidatePath(`/my-presentations/edit/${presentationId}`);
  revalidatePath('/review-submissions');
  return { success: true };
};

/**
 * Updates an existing draft presentation.
 * The FormData must include a `presentationId` field.
 * Co-presenter logic mirrors submitNewPresentation (add new accounts, update
 * presentation_presenters).  The submitter is always kept in the list even if
 * omitted from the form.
 */
export const updateDraftPresentation = async (
  data: FormData
): Promise<UpdateReturnType> => {
  const presentationId = data.get('presentationId');
  if (typeof presentationId !== 'string' || !presentationId) {
    return { success: false, error: { message: 'Missing presentationId' } };
  }

  const obj = Object.fromEntries(data);
  const parsedData = PresentationSubmissionFormSchema.safeParse(obj);
  if (!parsedData.success) {
    const errString = parsedData.error.format()._errors.join(', ');
    return { success: false, error: { message: errString } };
  }

  const {
    abstract,
    title,
    isFinal,
    learningPoints,
    otherPresenters,
    presentationType,
    speakerAgreement
  } = parsedData.data;

  // Require speaker agreement when submitting as final
  if (isFinal && !speakerAgreement) {
    return {
      success: false,
      error: { message: 'You must agree to the speaker agreement to submit.' }
    };
  }

  const supabase = await createServerActionClient();
  const supabaseAdmin = createAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const submitter_id = user?.id;

  if (typeof submitter_id === 'undefined') {
    return { success: false, error: { message: "Could not find the user's id" } };
  }

  // Verify the draft belongs to this user before updating
  const { data: existingDraft, error: fetchError } = await supabase
    .from('presentation_submissions')
    .select('id, submitter_id, is_submitted')
    .eq('id', presentationId)
    .maybeSingle();

  if (fetchError || !existingDraft) {
    return {
      success: false,
      error: { message: fetchError?.message ?? 'Presentation not found' }
    };
  }
  if (existingDraft.submitter_id !== submitter_id) {
    return {
      success: false,
      error: { message: 'You do not have permission to edit this presentation' }
    };
  }
  if (existingDraft.is_submitted) {
    return {
      success: false,
      error: { message: 'Submitted presentations cannot be edited' }
    };
  }

  const { error: updateError } = await supabase
    .from('presentation_submissions')
    .update({
      title,
      abstract,
      learning_points: learningPoints,
      is_submitted: isFinal,
      presentation_type: presentationType,
      // Record consent timestamp when the user ticks the agreement
      ...(speakerAgreement ? { consent_given_at: new Date().toISOString() } : {})
    })
    .eq('id', presentationId);

  if (updateError) {
    await logErrorToDb(
      `updateDraftPresentation update failed: ${JSON.stringify({
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        presentationId,
        isFinal,
        presentationType
      })}`,
      'error',
      submitter_id
    );
    return { success: false, error: { message: DRAFT_UPDATE_CLIENT_ERROR } };
  }

  // Rebuild the presenters list
  const resolved = await resolveCopresenters(
    otherPresenters,
    supabaseAdmin,
    'updateDraftPresentation',
    submitter_id
  );
  if (!resolved.success) {
    return resolved;
  }
  const { existingPresenters, newPresenters } = resolved;

  const idArray = [
    submitter_id,
    ...existingPresenters.map((p) => p.id),
    ...newPresenters.map((p) => p.id)
  ];

  // Upsert desired links first, then prune extras.
  const { error: upsertPresentersError } = await supabaseAdmin
    .from('presentation_presenters')
    .upsert(
      idArray.map((presenter_id) => ({ presenter_id, presentation_id: presentationId }))
    );
  if (upsertPresentersError) {
    return {
      success: false,
      error: {
        message: `Failed to update presentation presenters: ${upsertPresentersError.message}`
      }
    };
  }

  const { error: prunePresentersError } = await supabaseAdmin
    .from('presentation_presenters')
    .delete()
    .eq('presentation_id', presentationId)
    .not(
      'presenter_id',
      'in',
      `(${idArray.map((id) => `'${id}'`).join(',')})`
    );
  if (prunePresentersError) {
    return {
      success: false,
      error: {
        message: `Failed to finalize presenter list: ${prunePresentersError.message}`
      }
    };
  }

  revalidatePath('/my-presentations');
  revalidatePath(`/my-presentations/edit/${presentationId}`);
  revalidatePath(`/presentations/${presentationId}`);
  if (isFinal) {
    revalidatePath('/review-submissions');
  }
  return { success: true };
};

/**
 * Form-action wrapper for final draft submission.
 * Keeps progressive enhancement support without relying on button name/value.
 */
export const submitFinalDraftPresentation = async (
  data: FormData
): Promise<UpdateReturnType> => {
  data.set('isFinal', 'on');
  return updateDraftPresentation(data);
};

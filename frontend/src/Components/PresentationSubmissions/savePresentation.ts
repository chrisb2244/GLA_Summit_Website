'use server';

import type { PresentationSubmissionFormData } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';
import { submissionsForYear } from '@/app/configConstants';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logErrorToDb } from '@/lib/utils';
import {
  resolveCopresenters,
  type ExistingPresenter,
  type NewPresenter
} from './copresenterHelpers';
import { PostgrestError } from '@supabase/supabase-js';

type GetAuthenticatedSubmitterIdResult =
  | { success: true; submitterId: string }
  | { success: false; error: { message: string } };

type SavePresentationOptions = {
  presentationData: PresentationSubmissionFormData;
  submitterId: string;
  callerName: string;
  presentationId?: string;
};

export type SavePresentationResult =
  | {
      success: true;
      presentationId: string;
      existingPresenters: ExistingPresenter[];
      newPresenters: NewPresenter[];
      prunedPresenters: ExistingPresenter[];
    }
  | { success: false; error: { message: string } };

export const getAuthenticatedSubmitterId =
  async (): Promise<GetAuthenticatedSubmitterIdResult> => {
    const supabase = await createServerActionClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return {
        success: false,
        error: { message: "Could not find the user's id" }
      };
    }

    return {
      success: true,
      submitterId: user.id
    };
  };

export const savePresentation = async ({
  presentationData,
  submitterId,
  callerName,
  presentationId
}: SavePresentationOptions): Promise<SavePresentationResult> => {
  const { isFinal, otherPresenters, speakerAgreement } = presentationData;

  let savedPresentationId = presentationId;

  // If presentationId is present, this relates to an existing draft.
  const isExistingPresentation = typeof presentationId === 'string';

  if (isFinal && !speakerAgreement) {
    return {
      success: false,
      error: { message: 'You must agree to the speaker agreement to submit.' }
    };
  }

  // INSERT or UPDATE the presentation entry.
  const uploadResult = await uploadPresentation(
    presentationData,
    submitterId,
    isExistingPresentation
  );
  if (!uploadResult.success) {
    return uploadResult;
  }
  savedPresentationId = uploadResult.presentationId;

  const supabaseAdmin = createAdminClient();
  const resolved = await resolveCopresenters(
    otherPresenters,
    supabaseAdmin,
    callerName,
    submitterId
  );
  if (!resolved.success) {
    return resolved;
  }

  const { existingPresenters, newPresenters } = resolved;
  const presenterIds = [
    submitterId,
    ...existingPresenters.map((presenter) => presenter.id),
    ...newPresenters.map((presenter) => presenter.id)
  ];

  const setPresenterResult = await setPresentationPresenters(
    savedPresentationId,
    presenterIds,
    supabaseAdmin
  );
  if (!setPresenterResult.success) {
    if (!isExistingPresentation) {
      await supabaseAdmin
        .from('presentation_submissions')
        .delete()
        .eq('id', savedPresentationId);
    }

    return {
      success: false,
      error: {
        message: isExistingPresentation
          ? `Failed to update presentation presenters: ${setPresenterResult.error.message}`
          : `Failed to save presentation presenters: ${setPresenterResult.error.message}`
      }
    };
  }

  let prunedPresenters: ExistingPresenter[] = [];
  if (isExistingPresentation) {
    const pruneResult = await prunePresentationPresenters(
      savedPresentationId,
      presenterIds,
      supabaseAdmin
    );

    if (!pruneResult.success) {
      return {
        success: false,
        error: {
          message: `Failed to finalize presenter list: ${pruneResult.error.message}`
        }
      };
    }
    prunedPresenters = pruneResult.prunedPresenters;
  }

  return {
    success: true,
    presentationId: savedPresentationId,
    existingPresenters,
    newPresenters,
    prunedPresenters
  };
};

const uploadPresentation = async (
  presentationData: PresentationSubmissionFormData,
  submitterId: string,
  isExistingPresentation: boolean
): Promise<
  | { success: true; presentationId: string }
  | { success: false; error: { message: string } }
> => {
  const supabase = await createServerActionClient();
  const {
    presentationId,
    title,
    abstract,
    learningPoints,
    isFinal,
    presentationType,
    speakerAgreement
  } = presentationData;

  if (!isExistingPresentation) {
    const { data, error } = await supabase
      .from('presentation_submissions')
      .insert({
        title,
        abstract,
        learning_points: learningPoints,
        submitter_id: submitterId,
        year: submissionsForYear,
        is_submitted: isFinal,
        presentation_type: presentationType,
        ...(speakerAgreement
          ? { consent_given_at: new Date().toISOString() }
          : {})
      })
      .select('id')
      .single();

    if (error) {
      await logUploadError(error, submitterId);
      return {
        success: false,
        error: {
          message: isFinal
            ? 'Failed to submit presentation'
            : 'Failed to save draft'
        }
      };
    }

    return {
      success: true,
      presentationId: data.id
    };
  } else {
    if (typeof presentationId !== 'string' || !presentationId) {
      return {
        success: false,
        error: { message: 'Missing presentationId' }
      };
    }

    const { error } = await supabase
      .from('presentation_submissions')
      .update({
        title,
        abstract,
        learning_points: learningPoints,
        is_submitted: isFinal,
        presentation_type: presentationType,
        ...(speakerAgreement
          ? { consent_given_at: new Date().toISOString() }
          : {})
      })
      .eq('id', presentationId);

    if (error) {
      await logUploadError(error, submitterId);
      return {
        success: false,
        error: {
          message: isFinal
            ? 'Failed to submit presentation'
            : 'Failed to save draft'
        }
      };
    }

    return {
      success: true,
      presentationId
    };
  }
};

const setPresentationPresenters = async (
  presentationId: string,
  presenterIds: string[],
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<
  { success: true } | { success: false; error: { message: string } }
> => {
  const { error } = await supabaseAdmin.from('presentation_presenters').upsert(
    presenterIds.map((presenter_id) => ({
      presenter_id,
      presentation_id: presentationId
    }))
  );

  if (error) {
    return {
      success: false,
      error: { message: `Failed to set presenters: ${error.message}` }
    };
  }

  return { success: true };
};

const prunePresentationPresenters = async (
  presentationId: string,
  presenterIds: string[],
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<
  | { success: true; prunedPresenters: ExistingPresenter[] }
  | { success: false; error: { message: string } }
> => {
  const { data, error } = await supabaseAdmin
    .from('presentation_presenters')
    .delete()
    .eq('presentation_id', presentationId)
    .not(
      'presenter_id',
      'in',
      `(${presenterIds.map((id) => `'${id}'`).join(',')})`
    )
    .select('presenter_id');

  if (error) {
    return {
      success: false,
      error: { message: `Failed to prune presenters: ${error.message}` }
    };
  }

  const prunedIds = data.map(({ presenter_id }) => presenter_id);
  const { data: prunedPresenters, error: lookupError } = await supabaseAdmin
    .from('email_lookup')
    .select('id, email')
    .in('id', prunedIds);

  if (lookupError) {
    // Log the error but still return success because the
    // pruning itself succeeded and the email lookup is less critical.
    logErrorToDb(
      `Failed to lookup pruned presenter emails: ${
        lookupError.message
      }. Presenter IDs: ${prunedIds.join(', ')}`,
      'error'
    );
  }

  return {
    success: true,
    prunedPresenters: prunedPresenters || []
  };
};

const logUploadError = async (error: PostgrestError, submitterId: string) => {
  await logErrorToDb(
    `savePresentation upload failed: ${JSON.stringify({
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })}`,
    'error',
    submitterId
  );
};

'use server';

import type { PresentationSubmissionFormData } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';
import {
  submissionsForYear,
  COPRESENTER_INVITE_WORKFLOW
} from '@/app/configConstants';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logToDb } from '@/lib/utils';
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

export type CopresenterEmailTargets = {
  newlyInvited: ExistingPresenter[];
  reinvited: ExistingPresenter[];
  spamBlocked: ExistingPresenter[];
};

export type SavePresentationResult =
  | {
      success: true;
      presentationId: string;
      existingPresenters: ExistingPresenter[];
      newPresenters: NewPresenter[];
      prunedPresenters: ExistingPresenter[];
      copresenterTargets: CopresenterEmailTargets;
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
  const { otherPresenters, speakerAgreement } = presentationData;

  let savedPresentationId = presentationId;

  // If presentationId is present, this relates to an existing draft.
  const isExistingPresentation = typeof presentationId === 'string';
  const isFinal = presentationData.submitIntent === 'submit';

  if (isFinal && !speakerAgreement) {
    return {
      success: false,
      error: { message: 'You must agree to the speaker agreement to submit.' }
    };
  }

  // INSERT or UPDATE the presentation entry.
  const uploadResult = await uploadPresentation(
    presentationData,
    isFinal,
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
    submitterId,
    savedPresentationId
  );
  if (!resolved.success) {
    return resolved;
  }

  const { existingPresenters, newPresenters } = resolved;
  const coPresenterIds = [
    ...existingPresenters.map((presenter) => presenter.id),
    ...newPresenters.map((presenter) => presenter.id)
  ];

  const setPresenterResult = await setPresentationPresenters(
    savedPresentationId,
    submitterId,
    coPresenterIds,
    existingPresenters,
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

  const allPresenterIds = [submitterId, ...coPresenterIds];

  let prunedPresenters: ExistingPresenter[] = [];
  if (isExistingPresentation) {
    const pruneResult = await prunePresentationPresenters(
      savedPresentationId,
      allPresenterIds,
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
    prunedPresenters,
    copresenterTargets: setPresenterResult.copresenterTargets
  };
};

const uploadPresentation = async (
  presentationData: PresentationSubmissionFormData,
  isFinal: boolean,
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

    const { data: updatedRow, error } = await supabase
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
      .eq('id', presentationId)
      .eq('submitter_id', submitterId)
      .select('id')
      .single();

    if (error || !updatedRow) {
      if (error) await logUploadError(error, submitterId);
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
  submitterId: string,
  coPresenterIds: string[],
  existingPresenters: ExistingPresenter[],
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<
  | { success: true; copresenterTargets: CopresenterEmailTargets }
  | { success: false; error: { message: string } }
> => {
  // Upsert submitter as always accepted
  const { error: submitterError } = await supabaseAdmin
    .from('presentation_presenters')
    .upsert({ presenter_id: submitterId, presentation_id: presentationId, status: 'accepted' });

  if (submitterError) {
    return {
      success: false,
      error: { message: `Failed to set submitter presenter: ${submitterError.message}` }
    };
  }

  if (coPresenterIds.length === 0) {
    return {
      success: true,
      copresenterTargets: { newlyInvited: [], reinvited: [], spamBlocked: [] }
    };
  }

  // Fetch existing rows to categorise co-presenters
  const { data: existingRows, error: fetchError } = await supabaseAdmin
    .from('presentation_presenters')
    .select('presenter_id, status, declined_count')
    .eq('presentation_id', presentationId)
    .in('presenter_id', coPresenterIds);

  if (fetchError) {
    return {
      success: false,
      error: { message: `Failed to fetch existing presenters: ${fetchError.message}` }
    };
  }

  const existingMap = new Map(
    (existingRows ?? []).map((r) => [r.presenter_id, r])
  );

  const trulyNew = coPresenterIds.filter((id) => !existingMap.has(id));
  const reinvitable = coPresenterIds.filter((id) => {
    const row = existingMap.get(id);
    return row?.status === 'declined' && row.declined_count < 2;
  });
  const spamBlockedIds = coPresenterIds.filter((id) => {
    const row = existingMap.get(id);
    return row?.status === 'declined' && row.declined_count >= 2;
  });

  // Insert new co-presenters. With the invite workflow on, they start 'pending'
  // and must accept; with it off, co-presenters are implicitly accepted.
  if (trulyNew.length > 0) {
    const { error } = await supabaseAdmin.from('presentation_presenters').insert(
      trulyNew.map((presenter_id) => ({
        presenter_id,
        presentation_id: presentationId,
        status: COPRESENTER_INVITE_WORKFLOW ? 'pending' : 'accepted'
      }))
    );
    if (error) {
      return {
        success: false,
        error: { message: `Failed to insert new presenters: ${error.message}` }
      };
    }
  }

  // Reset declined-but-reinvitable back to pending
  if (reinvitable.length > 0) {
    const { error } = await supabaseAdmin
      .from('presentation_presenters')
      .update({ status: 'pending' })
      .eq('presentation_id', presentationId)
      .in('presenter_id', reinvitable);
    if (error) {
      return {
        success: false,
        error: { message: `Failed to reinvite declined presenters: ${error.message}` }
      };
    }
  }

  const existingById = new Map(existingPresenters.map((p) => [p.id, p]));
  const toPresenter = (id: string): ExistingPresenter =>
    existingById.get(id) ?? { id, email: '', inviteUrl: '' };

  return {
    success: true,
    copresenterTargets: {
      newlyInvited: trulyNew.map(toPresenter),
      reinvited: reinvitable.map(toPresenter),
      spamBlocked: spamBlockedIds.map(toPresenter)
    }
  };
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
      `(${presenterIds.map((id) => `"${id}"`).join(',')})`
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
    logToDb('error', 'Failed to look up pruned presenter emails', 'submission/save', {
      context: { message: lookupError.message, code: lookupError.code, presenterCount: prunedIds.length }
    });
  }

  return {
    success: true,
    prunedPresenters: prunedPresenters || []
  };
};

const logUploadError = async (error: PostgrestError, submitterId: string) => {
  await logToDb('error', 'Presentation save failed', 'submission/save', {
    userId: submitterId,
    context: { message: error.message, code: error.code, details: error.details, hint: error.hint }
  });
};

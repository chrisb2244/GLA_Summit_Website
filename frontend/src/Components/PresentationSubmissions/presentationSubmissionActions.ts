'use server';
import 'server-only'; // Poison the module for client code.

import type {
  PresentationSubmissionFormData,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';
import { createAdminClient } from '@/lib/supabaseClient';
import {
  DRAFT_DELETE_CLIENT_ERROR,
  PRESENTATION_SAVE_CLIENT_ERROR,
  DeleteReturnType,
  SubmitReturnType
} from '@/actions/presentationActionTypes';
import { logErrorToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { sendMailApi } from '@/lib/sendMail';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn,
  RemovedCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { redirect } from 'next/navigation';
import {
  getAuthenticatedSubmitterId,
  savePresentation
} from './savePresentation';
import { createServerActionClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/app/configConstants';
import z from 'zod/v4';

/**
 * Server action that handles presentation form submission.
 * Validates form data, initiates presentation save, sends confirmation emails to all presenters,
 * and redirects on success or returns form errors on failure.
 *
 * When presentationId is provided, this is treated as an update to an existing presentation.
 * When presentationId is absent, this creates a new presentation. The presence of presentationId
 * affects email sending behavior—new presentations trigger initial co-presenter invitations,
 * while updates to existing presentations send different notifications to existing vs. newly-added presenters.
 */
export const submitPresentationAction = async (
  previousState: PresentationSubmissionFormState,
  formData: FormData
): Promise<PresentationSubmissionFormState> => {
  const hydratedStateData = getStateDataFromFormData(
    previousState.data,
    formData
  );
  const parsedData = PresentationSubmissionFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsedData.success) {
    const errorTree = z.treeifyError(parsedData.error);

    return {
      ...previousState,
      data: hydratedStateData,
      duplicateWarning: undefined,
      status: undefined,
      errors: errorTree
    };
  }

  const normalizedData: PresentationSubmissionFormData = parsedData.data;
  const isFinalSubmission = normalizedData.submitIntent === 'submit';

  if (isFinalSubmission && !normalizedData.skipDuplicateCheck) {
    const duplicateResult = await findDuplicateSubmission(normalizedData);
    if (duplicateResult !== null) {
      return {
        data: {
          ...normalizedData,
          skipDuplicateCheck: false
        },
        errors: undefined,
        status: undefined,
        duplicateWarning: duplicateResult
      };
    }
  }

  const result = await handlePresentationSubmission(
    normalizedData,
    isFinalSubmission
  );

  if (result.success) {
    const isEditingDraft =
      typeof normalizedData.presentationId === 'string' &&
      normalizedData.presentationId.length > 0;

    if (isFinalSubmission) {
      redirect('/my-presentations?action=draft-submitted');
    }

    if (!isEditingDraft) {
      redirect('/my-presentations?action=draft-saved');
    }

    return {
      data: {
        ...normalizedData,
        skipDuplicateCheck: false
      },
      errors: undefined,
      duplicateWarning: undefined,
      status: {
        type: 'success',
        message: 'Draft saved successfully.'
      }
    };
  } else {
    await logErrorToDb(
      `submitPresentationAction failed: ${JSON.stringify({
        message:
          'error' in result ? result.error.message : 'Duplicate submission',
        formData: Object.fromEntries(formData.entries())
      })}`,
      'error'
    );
    return {
      ...previousState,
      data: hydratedStateData,
      duplicateWarning: undefined,
      errors: {
        errors: [PRESENTATION_SAVE_CLIENT_ERROR]
      },
      status: {
        type: 'error',
        message: PRESENTATION_SAVE_CLIENT_ERROR
      }
    };
  }
};

const getStateDataFromFormData = (
  fallbackData: PresentationSubmissionFormState['data'],
  formData: FormData
): PresentationSubmissionFormState['data'] => {
  const getString = (key: string, fallback: string) => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : fallback;
  };

  const otherPresenters = Array.from(formData.entries())
    .filter(([key]) => /otherPresenters\.[0-9]+\.email/.test(key))
    .map(([, value]) => (typeof value === 'string' ? value : ''))
    .filter((value) => value.length > 0);

  const presentationIdRaw = getString(
    'presentationId',
    fallbackData.presentationId ?? ''
  );
  const redirectToRaw = getString('redirectTo', fallbackData.redirectTo ?? '');
  const submitIntentRaw = getString('submitIntent', fallbackData.submitIntent);

  return {
    title: getString('title', fallbackData.title),
    abstract: getString('abstract', fallbackData.abstract),
    learningPoints: getString('learningPoints', fallbackData.learningPoints),
    presentationType:
      getString('presentationType', fallbackData.presentationType) ===
      '15 minutes'
        ? '15 minutes'
        : getString('presentationType', fallbackData.presentationType) === '7x7'
        ? '7x7'
        : getString('presentationType', fallbackData.presentationType) ===
          'panel'
        ? 'panel'
        : 'full length',
    submitter: {
      firstName: getString(
        'submitter.firstName',
        fallbackData.submitter.firstName
      ),
      lastName: getString(
        'submitter.lastName',
        fallbackData.submitter.lastName
      ),
      email: getString('submitter.email', fallbackData.submitter.email)
    },
    speakerAgreement:
      typeof formData.get('speakerAgreement') === 'string' ||
      fallbackData.speakerAgreement,
    skipDuplicateCheck:
      getString(
        'skipDuplicateCheck',
        fallbackData.skipDuplicateCheck ? 'true' : 'false'
      ) === 'true',
    submitIntent: submitIntentRaw === 'saveDraft' ? 'saveDraft' : 'submit',
    otherPresenters:
      otherPresenters.length > 0
        ? otherPresenters
        : fallbackData.otherPresenters,
    ...(presentationIdRaw.length > 0
      ? { presentationId: presentationIdRaw }
      : {}),
    ...(redirectToRaw.length > 0 ? { redirectTo: redirectToRaw } : {})
  };
};

const normalizeTitle = (title: string) =>
  title.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const findDuplicateSubmission = async (
  presentationData: PresentationSubmissionFormData
): Promise<{ existingId: string; existingTitle: string } | null> => {
  const submitterResult = await getAuthenticatedSubmitterId();
  if (!submitterResult.success) {
    return null;
  }

  const { submitterId } = submitterResult;
  const normalizedTitle = normalizeTitle(presentationData.title);
  const supabaseAdmin = createAdminClient();

  let query = supabaseAdmin
    .from('presentation_submissions')
    .select('id, title')
    .eq('submitter_id', submitterId)
    .eq('year', submissionsForYear);

  if (presentationData.presentationId) {
    query = query.neq('id', presentationData.presentationId);
  }

  const { data: existingRows, error } = await query;

  if (error) {
    await logErrorToDb(
      `findDuplicateSubmission failed: ${JSON.stringify({
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })}`,
      'error',
      submitterId
    );
    return null;
  }

  const existingWithTitle = (existingRows ?? []).find(
    ({ title }) => normalizeTitle(title) === normalizedTitle
  );

  if (!existingWithTitle) {
    return null;
  }

  return {
    existingId: existingWithTitle.id,
    existingTitle: existingWithTitle.title
  };
};

/**
 * Handles the core presentation submission logic.
 * Authenticates the user, saves the presentation and associates presenters,
 * then sends confirmation emails to the submitter and all co-presenters.
 */
const handlePresentationSubmission = async (
  presentationData: PresentationSubmissionFormData,
  isFinal: boolean
): Promise<SubmitReturnType> => {
  const supabaseAdmin = createAdminClient();
  const submitterResult = await getAuthenticatedSubmitterId();
  if (!submitterResult.success) {
    return submitterResult;
  }
  const { submitterId } = submitterResult;

  const { otherPresenters, submitter, presentationId } = presentationData;

  const savedPresentationResult = await savePresentation({
    presentationData,
    submitterId,
    callerName: 'submitPresentationAction',
    presentationId
  });
  if (!savedPresentationResult.success) {
    return savedPresentationResult;
  }

  const isNew = !presentationId;
  // If isFinal - email all presenters
  // Otherwise, only email newPresenters to confirm they've been added as co-presenters.
  // Don't send an email to the submitter since they may just be saving a draft and not ready for notifications to go out.

  const { existingPresenters, newPresenters, prunedPresenters } =
    savedPresentationResult;
  console.log({ newPresenters, existingPresenters, prunedPresenters });

  // Send emails to each user
  const dataForEmails = {
    ...presentationData,
    otherPresenters: otherPresenters.map((e) => ({
      email: e
    })),
    timeWindows: []
  };

  let allEmailPromises = [];
  // Submitter
  if (isFinal) {
    const submitterNameString = `${submitter.firstName} ${submitter.lastName}`;
    const submitterEmailPromise = sendMailApi({
      to: submitter.email,
      subject: 'GLA Summit: Thank you for submitting a presentation',
      ...FormSubmissionEmailFn(dataForEmails, submitterNameString)
    });
    allEmailPromises.push(submitterEmailPromise);
  }

  // Existing co-presenters
  if (isNew || isFinal) {
    const subject = isNew
      ? 'GLA Summit: You have been added as a co-presenter!'
      : 'GLA Summit: Your presentation has been submitted!';
    const existingPresenterEmailPromises = existingPresenters.map(
      async ({ id, email }) => {
        // Since they exist, there should always be a profile entry via the db trigger.
        const nameString = await getNameString(id, email, supabaseAdmin);
        return sendMailApi({
          to: email,
          subject,
          ...FormSubmissionEmailFn(dataForEmails, nameString)
        });
      }
    );
    allEmailPromises.push(...existingPresenterEmailPromises);
  }

  // New co-presenters
  // This will only reach an individual once, regardless of drafts/edits/submissions.
  // On subsequent changes, they will be included in existingPresenters group and
  // only receive the existing presenter email when finally submitted.
  const newPresenterEmailPromises = newPresenters.map(({ email, otpLink }) =>
    sendMailApi({
      to: email,
      subject: 'GLA Summit: You have been added as a co-presenter!',
      ...NewCopresenterEmailFn(dataForEmails, email, otpLink)
    })
  );
  allEmailPromises.push(...newPresenterEmailPromises);

  // Emails for pruned presenters if this is an existing presentation and presenters were removed
  const prunedPresenterEmailPromises = prunedPresenters.map(
    async ({ id, email }) => {
      // Since they exist, there should always be a profile entry via the db trigger.
      const nameString = await getNameString(id, email, supabaseAdmin);
      return sendMailApi({
        to: email,
        subject: 'GLA Summit: You have been removed as a co-presenter',
        ...RemovedCopresenterEmailFn(dataForEmails, nameString)
      });
    }
  );
  allEmailPromises.push(...prunedPresenterEmailPromises);

  const allEmailResults = await Promise.all(allEmailPromises);
  const successfulEmails = allEmailResults.filter((r) => r.status === 200);
  const unsuccessfulEmails = allEmailResults.filter((r) => r.status !== 200);
  console.log({ successfulEmails, unsuccessfulEmails });

  revalidatePath('/my-presentations');
  revalidatePath('/submit-presentation');

  if (presentationId) {
    revalidatePath(`/my-presentations/edit/${presentationId}`);
    revalidatePath(`/presentations/${presentationId}`);
    revalidateTag(`presentation:${presentationId}`, 'max');
    revalidateTag(`presentation-video:${presentationId}`, 'max');
  }

  return { success: true };
};

/**
 * Deletes a draft presentation owned by the current user.
 * RLS enforces ownership (submitter_id = auth.uid()) and draft-only deletion.
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

const getNameString = async (
  id: string,
  email: string,
  supabaseAdmin: ReturnType<typeof createAdminClient>
) => {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', id)
    .single();
  let nameString = email;
  if (data !== null) {
    // Could be two empty strings if profile not completed after being added as a copresenter previously.
    const candidateNameString = `${data.firstname} ${data.lastname}`;
    if (candidateNameString.trim().length !== 0) {
      nameString = candidateNameString;
    }
  }
  return nameString;
};

'use server';
import 'server-only'; // Poison the module for client code.

import type {
  PresentationSubmissionFormData,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import {
  PresentationFormParser,
  PresentationSubmissionFormSchema
} from './PresentationSubmissionFormSchema';
import { createAdminClient } from '@/lib/supabaseClient';
import {
  DRAFT_DELETE_CLIENT_ERROR,
  PRESENTATION_SAVE_CLIENT_ERROR,
  DeleteReturnType,
  SubmitReturnType
} from '@/actions/presentationActionTypes';
import { logToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { sendMailApi } from '@/lib/sendMail';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn,
  OrganizerSubmissionNotificationEmailFn,
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
  const raw = Object.fromEntries(formData.entries());

  // First parse the form data with the basic parser to handle type coercion and defaults
  const parsedData = PresentationFormParser.parse(raw);

  // Then validate the parsed data with the full schema which includes business logic refinements
  const validationResult = PresentationSubmissionFormSchema.safeParse(raw);

  if (!validationResult.success) {
    const errorTree = z.treeifyError(validationResult.error);

    return {
      ...previousState,
      data: parsedData, // Use the parsed data with coercions/defaults applied, even if validation failed
      duplicateWarning: undefined,
      status: undefined,
      errors: errorTree
    };
  }

  const validatedData = validationResult.data;
  const isFinalSubmission = validatedData.submitIntent === 'submit';

  if (isFinalSubmission && !validatedData.skipDuplicateCheck) {
    const duplicateResult = await findDuplicateSubmission(validatedData);
    if (duplicateResult !== null) {
      return {
        data: {
          ...validatedData,
          skipDuplicateCheck: false
        },
        errors: undefined,
        status: undefined,
        duplicateWarning: duplicateResult
      };
    }
  }

  const result = await handlePresentationSubmission(
    validatedData,
    isFinalSubmission
  );

  if (result.success) {
    const isEditingDraft =
      typeof validatedData.presentationId === 'string' &&
      validatedData.presentationId.length > 0;

    if (isFinalSubmission) {
      redirect('/my-presentations?action=draft-submitted');
    }

    if (!isEditingDraft) {
      redirect('/my-presentations?action=draft-saved');
    }

    return {
      data: {
        ...validatedData,
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
    await logToDb('error', 'Presentation submission failed', 'submission/actions', {
      context: {
        message: 'error' in result ? result.error.message : 'Duplicate submission',
        presentationId: validatedData.presentationId ?? null,
        presentationType: validatedData.presentationType,
        submitIntent: validatedData.submitIntent,
        // submitter.* and otherPresenters intentionally excluded — contain email addresses
      }
    });
    return {
      ...previousState,
      data: validatedData,
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
    await logToDb('error', 'Duplicate submission check failed', 'submission/actions', {
      userId: submitterId,
      context: { message: error.message, code: error.code, details: error.details, hint: error.hint }
    });
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

    // Organizers
    const { data: organizerRows } = await supabaseAdmin
      .from('organizers')
      .select('id');
    const organizerIds = (organizerRows ?? []).map((o) => o.id);
    const { data: organizerEmailRows } = await supabaseAdmin
      .from('email_lookup')
      .select('email')
      .in('id', organizerIds);
    const organizerEmailPromises = (organizerEmailRows ?? []).map(({ email }) =>
      sendMailApi({
        to: email,
        subject: 'GLA Summit: New presentation submitted',
        ...OrganizerSubmissionNotificationEmailFn(
          presentationData.title,
          presentationData.presentationType,
          submitterNameString,
          submitter.email
        )
      })
    );
    allEmailPromises.push(...organizerEmailPromises);
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

  const { data: deleted, error } = await supabase
    .from('presentation_submissions')
    .delete()
    .eq('id', presentationId)
    .select('id');

  if (error) {
    await logToDb('error', 'Failed to delete draft presentation', 'submission/actions', {
      context: { message: error.message, code: error.code, details: error.details, hint: error.hint, presentationId }
    });
    return { success: false, error: { message: DRAFT_DELETE_CLIENT_ERROR } };
  }

  if (!deleted || deleted.length === 0) {
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

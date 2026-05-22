'use server';
import 'server-only'; // Poison the module for client code.

import type {
  PresentationSubmissionFormData,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';
import { createAdminClient } from '@/lib/supabaseClient';
import {
  PRESENTATION_SAVE_CLIENT_ERROR,
  SubmitReturnType
} from '@/actions/presentationActionTypes';
import { logErrorToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
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

export const submitPresentationAction = async (
  previousState: PresentationSubmissionFormState,
  formData: FormData
): Promise<PresentationSubmissionFormState> => {
  const parsedData = PresentationSubmissionFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsedData.success) {
    const errorObjects = parsedData.error.flatten();

    return {
      ...previousState,
      errors: {
        ...errorObjects.fieldErrors,
        form:
          errorObjects.formErrors.length > 0
            ? errorObjects.formErrors.join(', ')
            : undefined
      }
    };
  }

  const result = await handlePresentationSubmission(parsedData.data);

  if (result.success) {
    const redirectTo = formData.get('redirectTo');
    if (redirectTo && typeof redirectTo === 'string') {
      redirect(redirectTo);
    }
    redirect('/my-presentations');
  } else {
    result;
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
      errors: {
        form: PRESENTATION_SAVE_CLIENT_ERROR
      }
    };
  }
};

const handlePresentationSubmission = async (
  presentationData: PresentationSubmissionFormData
): Promise<SubmitReturnType> => {
  const supabaseAdmin = createAdminClient();
  const submitterResult = await getAuthenticatedSubmitterId();
  if (!submitterResult.success) {
    return submitterResult;
  }
  const { submitterId } = submitterResult;

  const { otherPresenters, submitter, presentationId, isFinal } =
    presentationData;

  const savedPresentationResult = await savePresentation({
    presentationData,
    submitterId,
    callerName: 'submitPresentationAction',
    presentationId
  });
  if (!savedPresentationResult.success) {
    return savedPresentationResult;
  }

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
  if (isFinal) {
    const existingPresenterEmailPromises = existingPresenters.map(
      async ({ id, email }) => {
        // Since they exist, there should always be a profile entry via the db trigger.
        const nameString = await getNameString(id, email, supabaseAdmin);
        return sendMailApi({
          to: email,
          subject: 'GLA Summit: You have been added as a co-presenter!',
          ...FormSubmissionEmailFn(dataForEmails, nameString)
        });
      }
    );
    allEmailPromises.push(...existingPresenterEmailPromises);
  }

  // New co-presenters
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

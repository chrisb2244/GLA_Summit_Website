'use server';
import 'server-only'; // Poison the module for client code.

import type {
  PresentationSubmissionFormData,
  PresentationSubmissionFormErrors,
  PresentationSubmissionFormState
} from './PresentationSubmissionFormSchema';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/app/configConstants';
import {
  PRESENTATION_SAVE_CLIENT_ERROR,
  SubmitReturnType
} from '@/actions/presentationActionTypes';
import { logErrorToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { sendMailApi } from '@/lib/sendMail';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { resolveCopresenters } from '@/actions/copresenterHelpers';
import { redirect } from 'next/navigation';

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
  const supabase = await createServerActionClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const submitter_id = user?.id;

  if (!submitter_id) {
    return {
      success: false,
      error: { message: "Could not find the user's id" }
    };
  }

  const {
    title,
    abstract,
    presentationType,
    learningPoints,
    isFinal,
    otherPresenters,
    submitter,
    speakerAgreement,
    skipDuplicateCheck
  } = presentationData;

  if (!speakerAgreement) {
    return {
      success: false,
      error: { message: 'You must agree to the speaker agreement to submit.' }
    };
  }

  // Handle duplicates?

  const { data: insertedData, error: insertionError } = await supabaseAdmin
    .from('presentation_submissions')
    .insert({
      title,
      abstract,
      learning_points: learningPoints,
      submitter_id,
      year: submissionsForYear,
      is_submitted: isFinal,
      presentation_type: presentationType,
      // Record the time the speaker agreed to the agreement.
      // speakerAgreement has been validated above.
      consent_given_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertionError) {
    await logErrorToDb(
      `submitNewPresentation insert failed: ${JSON.stringify({
        message: insertionError.message,
        code: insertionError.code,
        details: insertionError.details,
        hint: insertionError.hint,
        isFinal,
        presentationType
      })}`,
      'error',
      submitter_id
    );
    return {
      success: false,
      error: { message: PRESENTATION_SAVE_CLIENT_ERROR }
    };
  }
  const presentation_id = insertedData.id;

  const resolved = await resolveCopresenters(
    otherPresenters,
    supabaseAdmin,
    'submitNewPresentation',
    submitter_id
  );
  if (!resolved.success) {
    return resolved;
  }
  const { existingPresenters, newPresenters } = resolved;
  console.log({ newPresenters, existingPresenters });

  // Update presentation_presenters
  const idArray = [
    submitter_id,
    ...existingPresenters.map((p) => p.id),
    ...newPresenters.map((p) => p.id)
  ];
  const { error: presentersUpsertError } = await supabaseAdmin
    .from('presentation_presenters')
    .upsert(idArray.map((presenter_id) => ({ presenter_id, presentation_id })));
  if (presentersUpsertError) {
    // Compensate to avoid leaving an orphan draft/submission without presenter links.
    await supabaseAdmin
      .from('presentation_submissions')
      .delete()
      .eq('id', presentation_id);
    return {
      success: false,
      error: {
        message: `Failed to save presentation presenters: ${presentersUpsertError.message}`
      }
    };
  }

  // Send emails to each user
  const dataForEmails = {
    ...presentationData,
    otherPresenters: otherPresenters.map((e) => ({
      email: e
    })),
    timeWindows: []
  };

  // Submitter
  const submitterNameString = `${submitter.firstName} ${submitter.lastName}`;
  const submitterEmailPromise = sendMailApi({
    to: submitter.email,
    subject: 'GLA Summit: Thank you for submitting a presentation',
    ...FormSubmissionEmailFn(dataForEmails, submitterNameString)
  });

  // Existing co-presenters
  const existingPresenterEmailPromises = existingPresenters.map(
    async ({ id, email }) => {
      // Since they exist, there should always be a profile entry via the db trigger.
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
      return sendMailApi({
        to: email,
        subject: 'GLA Summit: You have been added as a co-presenter!',
        ...FormSubmissionEmailFn(dataForEmails, nameString)
      });
    }
  );

  // New co-presenters
  const newPresenterEmailPromises = newPresenters.map(({ email, otpLink }) =>
    sendMailApi({
      to: email,
      subject: 'GLA Summit: You have been added as a co-presenter!',
      ...NewCopresenterEmailFn(dataForEmails, email, otpLink)
    })
  );

  const allEmailResults = await Promise.all([
    submitterEmailPromise,
    ...existingPresenterEmailPromises,
    ...newPresenterEmailPromises
  ]);
  const successfulEmails = allEmailResults.filter((r) => r.status === 200);
  const unsuccessfulEmails = allEmailResults.filter((r) => r.status !== 200);
  console.log({ successfulEmails, unsuccessfulEmails });

  revalidatePath('/my-presentations');
  revalidatePath('/submit-presentation');
  return { success: true };
};

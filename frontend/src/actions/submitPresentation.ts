'use server';
import { PresentationSubmissionFormSchema } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { submissionsForYear } from '@/app/configConstants';
import { sendMailApi } from '@/lib/sendMail';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { logErrorToDb } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { resolveCopresenters } from './copresenterHelpers';
import {
  PRESENTATION_SAVE_CLIENT_ERROR,
  SubmitReturnType
} from './presentationActionTypes';

export const submitNewPresentation = async (
  data: FormData
): Promise<SubmitReturnType> => {
  const obj = Object.fromEntries(data);
  const parsedData = PresentationSubmissionFormSchema.safeParse(obj);
  if (parsedData.success) {
    const {
      abstract,
      title,
      isFinal,
      learningPoints,
      otherPresenters,
      presentationType,
      speakerAgreement,
      skipDuplicateCheck,
      submitter
    } = parsedData.data;
    const supabaseAdmin = createAdminClient();
    const supabase = await createServerActionClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const submitter_id = user?.id;
    console.log({ submitter_id });
    if (typeof submitter_id === 'undefined') {
      return {
        success: false,
        error: {
          message: "Could not find the user's id"
        }
      };
    }

    // Enforce speaker agreement server-side
    if (!speakerAgreement) {
      return {
        success: false,
        error: { message: 'You must agree to the speaker agreement to submit.' }
      };
    }

    // Duplicate detection: check for an existing submission with the same title
    // for this submitter and year unless the user has explicitly bypassed the check.
    if (!skipDuplicateCheck) {
      const { data: existingWithTitle } = await supabaseAdmin
        .from('presentation_submissions')
        .select('id, title')
        .eq('submitter_id', submitter_id)
        .eq('year', submissionsForYear)
        .ilike('title', title.trim())
        .limit(1)
        .maybeSingle();

      if (existingWithTitle) {
        return {
          success: false,
          isDuplicate: true,
          existingId: existingWithTitle.id,
          existingTitle: existingWithTitle.title
        };
      }
    }

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
        // speakerAgreement has already been validated above.
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
      ...parsedData.data,
      otherPresenters: parsedData.data.otherPresenters.map((e) => ({ email: e })),
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
  } else {
    const errString = parsedData.error.format()._errors.join(', ');
    return {
      success: parsedData.success,
      error: { message: errString }
    };
  }
};

'use server';
import { PresentationSubmissionFormSchema } from '@/Components/Forms/PresentationSubmissionFormSchema';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { submissionsForYear } from '@/app/configConstants';
import { sendMailApi } from '@/lib/sendMail';
import { getUser } from '@/lib/supabase/userFunctions';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';
import { AuthError } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

type ReturnType =
  | {
      success: true;
    }
  | {
      success: false;
      error: { message: string };
    }
  | {
      success: false;
      isDuplicate: true;
      existingId: string;
      existingTitle: string;
    };

export const submitNewPresentation = async (
  data: FormData
): Promise<ReturnType> => {
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
    const user = await getUser();
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
      const { data: existingWithTitle } = await supabase
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

    const { data: insertedData, error: insertionError } = await supabase
      .from('presentation_submissions')
      .insert({
        title,
        abstract,
        learning_points: learningPoints,
        submitter_id,
        year: submissionsForYear,
        is_submitted: isFinal,
        presentation_type: presentationType
      })
      .select()
      .single();

    if (insertionError) {
      return {
        success: false,
        error: { message: insertionError.message }
      };
    }
    const presentation_id = insertedData.id;

    // Lookup which presenters already have accounts and which are new
    const { data: existingPresenters, error: lookupOthersError } =
      await supabaseAdmin
        .from('email_lookup')
        .select('*')
        .in('email', otherPresenters);

    if (lookupOthersError) {
      return {
        success: false,
        error: {
          message: lookupOthersError.message
        }
      };
    }
    // Split the copresenters between existing and new accounts
    const foundEmails = existingPresenters.map(({ email }) => email);
    const newPresenterEmails = otherPresenters.filter(
      (email) => !foundEmails.includes(email)
    );
    console.log({
      newPresenterEmails,
      existingPresenters
    });

    // Create new accounts for 'newPresenterEmails'
    type NewPresenterCreationReturn =
      | NewPresenterSuccessReturn
      | NewPresenterFailureReturn;
    type NewPresenterSuccessReturn = {
      success: true;
      id: string;
      otpLink: string;
      email: string;
    };
    type NewPresenterFailureReturn = { success: false; error: AuthError };
    const newPresenterIds = await Promise.all(
      newPresenterEmails.map(
        async (email): Promise<NewPresenterCreationReturn> => {
          const randomPassword = randomBytes(32).toString('hex');
          const { data: newUser, error: newPresenterCreationError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: 'signup',
              email,
              password: randomPassword,
              options: {
                data: {
                  firstname: '',
                  lastname: ''
                }
              }
            });
          if (newPresenterCreationError) {
            return {
              success: false as const,
              error: newPresenterCreationError
            };
          }
          return {
            success: true as const,
            id: newUser.user.id,
            otpLink: newUser.properties.email_otp,
            email
          };
        }
      )
    );

    const successfullyCreatedNewPresenters = newPresenterIds.filter(
      (r) => r.success
    ) as NewPresenterSuccessReturn[];
    const failedToCreateNewPresenters = newPresenterIds.filter(
      (r) => !r.success
    ) as NewPresenterFailureReturn[];
    console.log({ failedToCreateNewPresenters });

    // Update presentation_presenters
    const idArray = [
      submitter_id,
      ...existingPresenters.map((p) => p.id),
      ...successfullyCreatedNewPresenters.map((p) => p.id)
    ];
    const presentationPresenterData = idArray.map((presenter_id) => {
      return { presenter_id, presentation_id };
    });
    await supabaseAdmin
      .from('presentation_presenters')
      .upsert(presentationPresenterData);

    // Send emails to each user
    const dataForEmails = {
      ...parsedData.data,
      otherPresenters: parsedData.data.otherPresenters.map((e) => {
        return { email: e };
      }),
      timeWindows: []
    };
    // Submitter
    const submitterNameString = `${submitter.firstName} ${submitter.lastName}`;
    const submitterEmailPromise = sendMailApi({
      to: submitter.email,
      subject: 'GLA Summit: Thank you for submitting a presentation',
      ...FormSubmissionEmailFn(dataForEmails, submitterNameString)
    });

    // Existing Copresenters
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

    // New Copresenters
    const newPresenterEmailPromises = successfullyCreatedNewPresenters.map(
      ({ email, otpLink }) => {
        return sendMailApi({
          to: email,
          subject: 'GLA Summit: You have been added as a co-presenter!',
          ...NewCopresenterEmailFn(dataForEmails, email, otpLink)
        });
      }
    );

    const allEmailPromises = await Promise.all([
      ...[submitterEmailPromise],
      ...existingPresenterEmailPromises,
      ...newPresenterEmailPromises
    ]);
    const successfulEmails = allEmailPromises.filter(
      (result) => result.status === 200
    );
    const unsuccessfulEmails = allEmailPromises.filter(
      (result) => result.status !== 200
    );
    console.log({ successfulEmails, unsuccessfulEmails });

    revalidatePath('/my-presentations');
    return new Promise((r) => {
      const returnValue = {
        success: true as const
      };
      setTimeout(() => r(returnValue), 2000);
    });
  } else {
    const errString = parsedData.error.format()._errors.join(', ');
    return {
      success: parsedData.success,
      error: { message: errString }
    };
  }
};

type DeleteReturnType =
  | { success: true }
  | { success: false; error: { message: string } };

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
    return { success: false, error: { message: error.message } };
  }

  revalidatePath('/my-presentations');
  return { success: true };
};

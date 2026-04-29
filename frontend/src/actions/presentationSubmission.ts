'use server';
import { PresentationSubmissionFormSchema } from '@/Components/Forms/PresentationSubmissionFormSchema';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { submissionsForYear } from '@/app/configConstants';
import { sendMailApi } from '@/lib/sendMail';
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
        presentation_type: presentationType,
        // Record the time the speaker agreed to the agreement.
        // speakerAgreement has already been validated above.
        consent_given_at: new Date().toISOString()
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
    const { error: presentersUpsertError } = await supabaseAdmin
      .from('presentation_presenters')
      .upsert(presentationPresenterData);
    if (presentersUpsertError) {
      // Compensate to avoid leaving an orphan draft/submission without presenter links.
      await supabase
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
    revalidatePath('/submit-presentation');
    return {
      success: true
    };
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

type UpdateReturnType =
  | { success: true }
  | { success: false; error: { message: string } };

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
    return { success: false, error: { message: updateError.message } };
  }

  // Rebuild the presenters list
  const { data: existingPresenters, error: lookupError } = await supabaseAdmin
    .from('email_lookup')
    .select('*')
    .in('email', otherPresenters);

  if (lookupError) {
    return { success: false, error: { message: lookupError.message } };
  }

  const foundEmails = existingPresenters.map(({ email }) => email);
  const newPresenterEmails = otherPresenters.filter(
    (email) => !foundEmails.includes(email)
  );

  type NewPresenterCreationReturn =
    | { success: true; id: string; email: string }
    | { success: false; error: AuthError };

  const newPresenterResults = await Promise.all(
    newPresenterEmails.map(
      async (email): Promise<NewPresenterCreationReturn> => {
        const randomPassword = randomBytes(32).toString('hex');
        const { data: newUser, error: creationError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            password: randomPassword,
            options: { data: { firstname: '', lastname: '' } }
          });
        if (creationError) {
          return { success: false as const, error: creationError };
        }
        return { success: true as const, id: newUser.user.id, email };
      }
    )
  );

  const successfulNewPresenters = newPresenterResults.filter(
    (r) => r.success
  ) as { success: true; id: string; email: string }[];

  const idArray = [
    submitter_id,
    ...existingPresenters.map((p) => p.id),
    ...successfulNewPresenters.map((p) => p.id)
  ];

  // Upsert desired links first, then prune extras.
  const desiredPresenterRows = idArray.map((presenter_id) => ({
    presenter_id,
    presentation_id: presentationId
  }));

  const { error: upsertPresentersError } = await supabaseAdmin
    .from('presentation_presenters')
    .upsert(desiredPresenterRows);
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
  return { success: true };
};

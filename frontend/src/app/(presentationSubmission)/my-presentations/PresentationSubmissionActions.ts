'use server';

import { createServerActionClient } from '@/lib/supabaseServer';
import type { PresentationType } from '@/lib/databaseModels';
import type { PersonProps } from '@/Components/Form/Person';
import { getUser, registerEmailAddress } from '@/lib/supabase/userFunctions';
// Maybe move or check this one...
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';
import { submissionsForYear } from '../../configConstants';
import { createAdminClient } from '@/lib/supabaseClient';
import { sendMailApi } from '@/lib/sendMail';
import {
  FormSubmissionEmailFn,
  NewCopresenterEmailFn
} from '@/EmailTemplates/FormSubmissionEmail';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type SubmissionFormData = {
  submitter: PersonProps;
  otherPresenters: string[];
  otherPresentersList?: string;
  isFinal: boolean;
  title: string;
  abstract: string;
  learningPoints: string;
  presentationType: PresentationType;
};

export type PresentationSubmissionFormErrors = Partial<
  Omit<Record<keyof SubmissionFormData | 'form', string>, 'otherPresenters'> & {
    otherPresenters: Record<number, string>;
  }
>;

export type PresentationSubmissionActionState = {
  errors?: PresentationSubmissionFormErrors;
  success?: boolean;
  data: SubmissionFormData;
};

export const submitNewPresentation = async (
  previousData: PresentationSubmissionActionState,
  formData: FormData
): Promise<PresentationSubmissionActionState> => {
  const supabase = await createServerActionClient();
  const submittingUser = await getUser(supabase);
  if (submittingUser === null) {
    return {
      errors: {
        form: 'Could not find the submitting user'
      },
      success: false,
      data: previousData.data
    };
  }

  // Validate the submitted form data
  const obj = Object.fromEntries(formData);
  const parsedData = PresentationSubmissionFormSchema.safeParse(obj);
  if (!parsedData.success) {
    return {
      errors: parsedData.error.errors.reduce((acc, e) => {
        const key = e.path[0] as keyof SubmissionFormData;
        acc[key] = e.message;
        console.log({ key, message: e.message, acc });
        return acc;
      }, {} as PresentationSubmissionFormErrors),
      success: false,
      data: previousData.data
    };
  }

  const {
    abstract,
    title,
    isFinal,
    learningPoints,
    otherPresenters,
    presentationType,
    submitter
  } = parsedData.data;

  // Insert the presentation submission
  const { data: insertedData, error: insertionError } = await supabase
    .from('presentation_submissions')
    .insert({
      title,
      abstract,
      learning_points: learningPoints,
      submitter_id: submittingUser.id,
      year: submissionsForYear,
      is_submitted: isFinal,
      presentation_type: presentationType
    })
    .select()
    .single();
  if (insertionError) {
    return {
      errors: {
        form: insertionError.message
      },
      success: false,
      data: previousData.data
    };
  }

  const supabaseAdmin = createAdminClient();
  // Split presenters into existing and new
  const { data: existingPresenters, error: lookupOthersError } =
    await supabaseAdmin
      .from('email_lookup')
      .select('*')
      .in('email', otherPresenters);

  if (lookupOthersError) {
    return {
      success: false,
      errors: {
        form: lookupOthersError.message
      },
      data: previousData.data
    };
  }
  // Split the copresenters between existing and new accounts
  const foundEmails = existingPresenters.map(({ email }) => email);
  const newPresenterEmails = otherPresenters.filter(
    (email) => !foundEmails.includes(email)
  );

  const newPresenterReturnVals = await Promise.all(
    newPresenterEmails.map(registerEmailAddress)
  );
  const successfullyCreatedNewPresenters = newPresenterReturnVals.filter(
    (v) => v.success
  );
  const failedNewPresenters = newPresenterReturnVals.filter((v) => !v.success);
  // Log the failed new presenters
  // TODO: Handle this problem
  failedNewPresenters.forEach(({ error }) => {
    console.error('Failed to create new presenter:', error);
  });

  // Update presentation_presenters
  const presentation_id = insertedData.id;
  const idArray = [
    submittingUser.id,
    ...existingPresenters.map(({ id }) => id),
    ...successfullyCreatedNewPresenters.map(({ id }) => id)
  ];
  const presentationPresenterData = idArray.map((presenter_id) => {
    return { presenter_id, presentation_id };
  });
  await supabaseAdmin
    .from('presentation_presenters')
    .upsert(presentationPresenterData);

  // Email each group
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
  // TODO: Consider logging the email results? Or the unsuccessful ones?

  revalidatePath('/my-presentations');
  redirect('/presentation-submitted');
  // return {
  //   errors: undefined,
  //   success: true,
  //   data: parsedData.data
  // };
};

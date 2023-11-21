'use server';
import { PresentationSubmissionFormSchema } from '@/Components/Forms/PresentationSubmissionFormSchema';
import { adminAddNewPresentationSubmission } from '@/lib/databaseFunctions';
import { submissionsForYear } from '@/lib/databaseModels';
import { uploadPresentationData } from '@/lib/presentationSubmissionHelpers';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerActionClient } from '@/lib/supabaseServer';

export const submitNewPresentation = async (
  data: FormData
): Promise<{ success: boolean; error?: object }> => {
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
      submitter
    } = parsedData.data;
    const supabaseAdmin = createAdminClient();
    const supabase = createServerActionClient();
    const submitter_id = (await supabase.auth.getSession()).data.session?.user
      .id;
    console.log({ submitter_id });
    if (typeof submitter_id === 'undefined') {
      return {
        success: false,
        error: {
          message: "Could not find the user's id"
        }
      };
    }
    // const { data: insertedData, error: insertionError } = await supabase
    //   .from('presentation_submissions')
    //   .insert({
    //     title,
    //     abstract,
    //     learning_points: learningPoints,
    //     submitter_id,
    //     year: submissionsForYear,
    //     is_submitted: isFinal,
    //     presentation_type: presentationType
    //   })
    //   .select()
    //   .single();

    // if (insertionError) {
    //   return {
    //     success: false,
    //     error: { hint: insertionError.hint }
    //   };
    // }
    // const presentationId = insertedData.id;

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
          hint: lookupOthersError.hint
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

    return new Promise((r) => {
      const returnValue = {
        success: true
      };
      setTimeout(() => r(returnValue), 2000);
    });
  } else {
    return {
      success: parsedData.success,
      error: parsedData.error.format()
    };
  }
};

import type { Database } from '@/lib/sb_databaseModels';
import { createSupabaseAdmin } from './supabaseAdmin';

type SharedPresentationSeedOptions = {
  title: string;
  year: Database['public']['Enums']['summit_year'];
  // IDs of script-created users (see utils/userCreation). The submitter owns
  // the submission; the copresenter is linked as an additional presenter.
  submitterId: string;
  copresenterId: string;
  status: 'accepted' | 'awaiting-response';
  isSubmitted?: boolean;
};

export const seedSharedPresentation = async (
  options: SharedPresentationSeedOptions
) => {
  const admin = createSupabaseAdmin();
  const { title, year, submitterId, copresenterId, status } = options;
  const isSubmitted = options.isSubmitted ?? true;

  const { data: presentation, error: presentationError } = await admin
    .from('presentation_submissions')
    .insert({
      title,
      abstract:
        'Shared presentation abstract used for copresenter visibility tests.',
      learning_points:
        'Shared learning points used for copresenter visibility and status tests.',
      submitter_id: submitterId,
      year,
      is_submitted: isSubmitted,
      presentation_type: 'full length'
    })
    .select('id')
    .single();

  if (presentationError || !presentation) {
    throw new Error(
      `Failed to create shared presentation: ${
        presentationError?.message ?? 'unknown error'
      }`
    );
  }

  const presentationId = presentation.id;

  const { error: presenterLinkError } = await admin
    .from('presentation_presenters')
    .insert([
      { presentation_id: presentationId, presenter_id: submitterId },
      { presentation_id: presentationId, presenter_id: copresenterId }
    ]);

  if (presenterLinkError) {
    await admin
      .from('presentation_submissions')
      .delete()
      .eq('id', presentationId);
    throw new Error(
      `Failed to link shared presentation presenters: ${presenterLinkError.message}`
    );
  }

  if (status === 'accepted') {
    const { error: acceptedInsertError } = await admin
      .from('accepted_presentations')
      .insert({ id: presentationId, year });
    if (acceptedInsertError) {
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('id', presentationId);
      throw new Error(
        `Failed to set accepted status for shared presentation: ${acceptedInsertError.message}`
      );
    }
  }

  return {
    presentationId,
    title,
    submitterId,
    copresenterId,
    cleanup: async () => {
      await admin
        .from('accepted_presentations')
        .delete()
        .eq('id', presentationId);
      await admin
        .from('rejected_presentations')
        .delete()
        .eq('id', presentationId);
      await admin
        .from('presentation_submissions')
        .delete()
        .eq('id', presentationId);
    }
  };
};

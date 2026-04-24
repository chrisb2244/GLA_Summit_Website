import { createServerClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { PersonProps } from '@/Components/Form/Person';
import { PresentationBaseFormData } from '@/Components/Forms/PresentationFormShared';
import { DraftEditForm } from '../../DraftEditForm';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false }
};

type Params = { id: string };

const DraftEditPage = async ({ params }: { params: Promise<Params> }) => {
  const { id } = await params;
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerClient();

  // Fetch the draft from the DB using the user-scoped view so RLS is enforced.
  const { data: draft, error } = await supabase
    .from('my_submissions')
    .select()
    .eq('presentation_id', id)
    .eq('is_submitted', false)
    .maybeSingle();

  if (error || !draft) {
    notFound();
  }

  // Build the submitter PersonProps
  const profile = await getProfileInfo(user, supabase).catch(() => null);
  const email = user.email ?? '';
  const submitter: PersonProps = {
    email,
    firstName: profile?.firstname ?? '',
    lastName: profile?.lastname ?? ''
  };

  // Co-presenters: every presenter except the submitter
  const coPresenterEmails = (draft.all_emails ?? []).filter(
    (e: string) => e !== email
  );

  const defaultValues: PresentationBaseFormData = {
    submitter,
    title: draft.title ?? '',
    abstract: draft.abstract ?? '',
    learningPoints: draft.learning_points ?? '',
    presentationType: draft.presentation_type ?? 'full length',
    isFinal: false,
    speakerAgreement: false,
    otherPresenters: coPresenterEmails.map((e: string) => ({ email: e }))
  };

  return (
    <div className='prose mx-auto flex max-w-none flex-col'>
      <h2>Edit Draft Presentation</h2>
      <DraftEditForm
        presentationId={id}
        submitter={submitter}
        defaultValues={defaultValues}
      />
    </div>
  );
};

export default DraftEditPage;

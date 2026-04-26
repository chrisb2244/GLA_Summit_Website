import { createServerClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { PersonProps } from '@/Components/Form/Person';
import { PresentationBaseFormData } from '@/Components/Forms/PresentationFormShared';
import { DraftEditForm } from '../../DraftEditForm';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  robots: { index: false }
};

type Params = { id: string };

const DraftEditPage = ({ params }: { params: Promise<Params> }) => {
  return (
    <Suspense fallback={<p>Loading draft...</p>}>
      <DraftEditPageContent params={params} />
    </Suspense>
  );
};

const DraftEditPageContent = async ({ params }: { params: Promise<Params> }) => {
  const { id } = await params;
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createServerClient();

  // Fetch the draft from the DB using the user-scoped RPC so RLS is enforced.
  const { data: draft, error } = await supabase
    .rpc('get_my_submissions')
    .eq('presentation_id', id)
    .eq('is_submitted', false)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[DraftEditPage] Failed to fetch draft:', error.message);
    notFound();
  }
  if (!draft) {
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

  const { data: presenterEmailsData, error: presenterEmailsError } = await (
    supabase as any
  ).rpc('get_editable_submission_emails', {
    p_presentation_id: id
  });
  if (presenterEmailsError) {
    console.error(
      '[DraftEditPage] Failed to fetch presenter emails:',
      presenterEmailsError.message
    );
  }

  const presenterEmails = Array.isArray(presenterEmailsData)
    ? presenterEmailsData
    : [];

  // Co-presenters: every presenter except the submitter
  const coPresenterEmails = presenterEmails.filter(
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

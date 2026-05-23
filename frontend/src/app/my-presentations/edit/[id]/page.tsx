import { createServerClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { PersonProps } from '@/Components/Form/Person';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PresentationFormFields } from '@/Components/PresentationSubmissions/PresentationFormFields2';
import { PresentationSubmissionFormData } from '@/Components/PresentationSubmissions/PresentationSubmissionFormSchema';

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
  const coPresenterEmails = presenterEmails.filter((e: string) => e !== email);

  const normalizePresentationType = () => {
    switch (draft.presentation_type) {
      case '7x7':
      case 'full length':
      case 'panel':
      case '15 minutes':
        return draft.presentation_type;
      default:
        return 'full length' as const;
    }
  };

  const defaultValues: PresentationSubmissionFormData = {
    submitter,
    title: draft.title ?? '',
    abstract: draft.abstract ?? '',
    learningPoints: draft.learning_points ?? '',
    presentationType: normalizePresentationType(),
    speakerAgreement: false,
    otherPresenters: coPresenterEmails,
    submitIntent: 'submit',
    skipDuplicateCheck: false,
    presentationId: id
  };

  return (
    <div className='prose mx-auto flex max-w-none flex-col'>
      <h2>Edit Draft Presentation</h2>
      <div className='prose'>
        <p>Edit your draft presentation below.</p>
        <p>
          Adding a co-presenter will email them an invitation if they do not
          already have an account.
        </p>

        <div className='border border-gray-200 bg-gray-100 p-2 shadow-lg'>
          <PresentationFormFields defaultValues={defaultValues} />
        </div>
      </div>
    </div>
  );
};

export default DraftEditPage;

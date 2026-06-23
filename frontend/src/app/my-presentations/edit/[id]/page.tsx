import { createServerClient } from '@/lib/supabaseServer';
import { getUser } from '@/lib/supabase/userFunctions';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { PersonProps } from '@/Components/Form/Person';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { logToDb } from '@/lib/utils';
import { PresentationFormFields } from '@/Components/PresentationSubmissions/PresentationFormFields';
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
    await logToDb('error', 'Failed to fetch draft', 'my-presentations/edit', {
      userId: user.id,
      context: { presentationId: id, message: error.message, code: error.code }
    });
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

  const { data: presenterEmailsData, error: presenterEmailsError } =
    await supabase.rpc('get_editable_submission_emails', {
      p_presentation_id: id
    });
  if (presenterEmailsError) {
    await logToDb('error', 'Failed to fetch presenter emails for draft edit', 'my-presentations/edit', {
      userId: user.id,
      context: { presentationId: id, message: presenterEmailsError.message, code: presenterEmailsError.code }
    });
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

        <PresentationFormFields defaultValues={defaultValues} />
      </div>
    </div>
  );
};

export default DraftEditPage;

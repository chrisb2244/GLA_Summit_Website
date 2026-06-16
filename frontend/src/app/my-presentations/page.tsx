import { PersonProps } from '@/Components/Form/Person';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { getUser } from '@/lib/supabase/userFunctions';
import { createServerClient } from '@/lib/supabaseServer';
import { User } from '@supabase/supabase-js';
import { Metadata } from 'next';
import { CAN_SUBMIT_PRESENTATION } from '../configConstants';
import { PastPresentationSubmissions } from './PastPresentationSubmissions';
import { PastPresentationSubmissionsFallback } from './PastPresentationSubmissions';
import Link from 'next/link';
import { Suspense } from 'react';
import { SuccessNotification } from './SuccessNotification';
import { NextSearchParams } from '@/lib/NextTypes';
import { PresentationFormFields } from '@/Components/PresentationSubmissions/PresentationFormFields';

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const SubmissionFormSection = async () => {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const supabase = await createServerClient();
  const getSubmitter = async (
    user: User | null
  ): Promise<{ submitter: PersonProps | null; profileIncomplete: boolean }> => {
    if (user === null || typeof user.email === 'undefined') {
      return { submitter: null, profileIncomplete: false };
    }
    const profile = await getProfileInfo(user, supabase).catch(() => null);
    if (!profile) {
      return { submitter: null, profileIncomplete: false };
    }
    const { firstname, lastname, bio, avatar_url } = profile;
    return {
      submitter: {
        email: user.email,
        firstName: firstname,
        lastName: lastname
      },
      profileIncomplete: !bio || !avatar_url
    };
  };

  const { submitter, profileIncomplete } = await getSubmitter(user);

  const submissionElements = CAN_SUBMIT_PRESENTATION ? (
    submitter && (
      <div className='mx-auto flex flex-col'>
        <h3>Submit a new Presentation</h3>
        {/* <PresentationSubmissionForm submitter={submitter} /> */}
        <div className='prose'>
          <p>
            Please enter the information below and submit your presentation.
          </p>
          <p>
            Any additional presenters that you add here will be emailed inviting
            them to create an account, if they do not have one already, and to
            join this presentation. Only you, the presentation submitter, will
            be able to edit the presentation.
          </p>
          <PresentationFormFields
            defaultValues={{
              submitter,
              title: '',
              abstract: '',
              learningPoints: '',
              presentationType: 'full length',
              speakerAgreement: false,
              skipDuplicateCheck: false,
              submitIntent: 'submit',
              otherPresenters: []
            }}
          />
        </div>
      </div>
    )
  ) : (
    <div className='mx-auto flex flex-col'>
      <p>The presentation submission process is closed.</p>
    </div>
  );

  return (
    <>
      {profileIncomplete && (
        <div className='mb-4 rounded-md border border-blue-300 bg-blue-50 p-3'>
          <p className='font-semibold text-blue-800'>Profile incomplete</p>
          <p className='text-blue-700'>
            Your{' '}
            <Link href='/my-profile' className='underline'>
              profile
            </Link>{' '}
            is missing a bio or photo. These will be shown in the conference
            programme — please update them before the event.
          </p>
        </div>
      )}
      {submissionElements}
    </>
  );
};

const SubmissionFormSectionFallback = () => {
  return <div className='flex min-h-16 animate-pulse bg-gray-200'></div>;
};

const MyPresentationsPage = ({
  searchParams
}: {
  searchParams: NextSearchParams;
}) => {
  return (
    <div className='prose mx-auto flex max-w-none flex-col'>
      <Suspense fallback={null}>
        <SuccessNotification searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<SubmissionFormSectionFallback />}>
        <SubmissionFormSection />
      </Suspense>
      <Suspense fallback={<PastPresentationSubmissionsFallback />}>
        <PastPresentationSubmissions />
      </Suspense>
    </div>
  );
};

export default MyPresentationsPage;

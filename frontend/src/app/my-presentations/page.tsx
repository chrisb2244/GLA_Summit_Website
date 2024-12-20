import { PersonProps } from '@/Components/Form/Person';
import { PresentationSubmissionForm } from './PresentationSubmissionForm';
import { getProfileInfo } from '@/lib/databaseFunctions';
import { getUser } from '@/lib/supabase/userFunctions';
import { createServerClient } from '@/lib/supabaseServer';
import { User } from '@supabase/supabase-js';
import { Metadata } from 'next';
import { CAN_SUBMIT_PRESENTATION } from '../configConstants';
import { Suspense } from 'react';
import {
  PastPresentationSubmissions,
  PastPresentationSubmissionsFallback
} from './PastPresentationSubmissions';

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const MyPresentationsPage = async () => {
  const user = await getUser();

  const supabase = await createServerClient();
  const getSubmitter = async (
    user: User | null
  ): Promise<PersonProps | null> => {
    if (user === null || typeof user.email === 'undefined') {
      return null;
    }
    const { firstname, lastname } = await getProfileInfo(user, supabase);
    return {
      email: user.email,
      firstName: firstname,
      lastName: lastname
    };
  };

  const submitter = await getSubmitter(user);

  // const activeDrafts = draftPresentations.filter(
  //   (p) => p.year === submissionsForYear
  // );
  // const draftEntries =
  //   activeDrafts.length === 0 ? (
  //     <div>
  //       <p>You have no active draft submissions</p>
  //     </div>
  //   ) : (
  //     activeDrafts.map((p) => {
  //       return (
  //         <div key={p.presentation_id}>
  //           <h4>{p.title}</h4>
  //         </div>
  //       );
  //     })
  //   );

  const submissionElements = CAN_SUBMIT_PRESENTATION ? (
    submitter && (
      <div className='mx-auto flex flex-col'>
        {/* <p>The presentation submission page is currently being reworked!</p>
        <p>We look forwards to being able to accept submissions soon.</p> */}
        <h3>Submit a new Presentation</h3>
        <PresentationSubmissionForm submitter={submitter} />
      </div>
    )
  ) : (
    <div className='mx-auto flex flex-col'>
      <p>The presentation submission process is closed.</p>
    </div>
  );

  return (
    <div className='prose mx-auto flex max-w-none flex-col'>
      {submissionElements}

      {/* <div>
        <h3>Draft Submissions</h3>
        {draftEntries}
      </div> */}

      <div className='mx-auto max-w-4xl'>
        <h3>Submitted Presentations</h3>
        <Suspense fallback={<PastPresentationSubmissionsFallback />}>
          {<PastPresentationSubmissions />}
        </Suspense>
      </div>
    </div>
  );
};

export default MyPresentationsPage;

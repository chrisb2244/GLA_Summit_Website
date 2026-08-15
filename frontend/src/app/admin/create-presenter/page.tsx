import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { isPresenterAdmin } from '@/lib/supabase/presenterAdmin';
import { submissionsForYear } from '@/app/configConstants';
import { CreatePresenterForm } from './CreatePresenterForm';

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const CreatePresenterPage = () => {
  return (
    <Suspense fallback={<p>Loading presenter creation...</p>}>
      <CreatePresenterPageContent />
    </Suspense>
  );
};

const CreatePresenterPageContent = async () => {
  // Same gate as /logs: membership of an allow-list table, checked under RLS
  // through the caller's own session. Anyone else (including logged-out
  // visitors) is bounced before any of the panel renders.
  if (!(await isPresenterAdmin())) {
    redirect('/access-denied');
  }

  return (
    <div className='prose mx-auto mt-4 flex max-w-none flex-col'>
      <h1>Create a Presenter</h1>
      <p>
        Use this panel when a presenter cannot submit for themselves — for
        example a proposal received by email. It creates their account and
        submits the presentation in their name for GLA Summit{' '}
        {submissionsForYear}.
      </p>
      {/* Deliberately not gated on CAN_SUBMIT_PRESENTATION: that flag closes the
          public form, while this panel exists precisely so an organizer can
          enter a submission the normal route cannot accept. */}
      <CreatePresenterForm />
      <p className='text-sm text-gray-600'>
        Presenters who already have an account cannot be created here — ask them
        to submit through the normal form, or add them as a co-presenter.
      </p>
    </div>
  );
};

export default CreatePresenterPage;

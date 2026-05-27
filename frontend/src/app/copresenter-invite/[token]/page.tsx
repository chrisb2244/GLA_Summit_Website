import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import type { NextParams, satisfy } from '@/lib/NextTypes';
import { verifyInviteToken } from '@/lib/copresenterInviteToken';
import { createAdminClient } from '@/lib/supabaseClient';
import { createServerClient } from '@/lib/supabaseServer';
import { CopresenterResponseButtons } from './CopresenterResponseButtons';

type RouteParams = satisfy<NextParams, Promise<{ token: string }>>;

const CopresenterInvitePage = ({ params }: { params: RouteParams }) => {
  return (
    <Suspense fallback={<div className='mx-auto max-w-lg py-12 px-4'>Loading...</div>}>
      <CopresenterInvitePageContent params={params} />
    </Suspense>
  );
};

const CopresenterInvitePageContent = async ({
  params
}: {
  params: RouteParams;
}) => {
  const { token } = await params;

  const payload = verifyInviteToken(token);
  if (!payload) {
    return (
      <main className='mx-auto max-w-lg py-12 px-4'>
        <h1 className='text-2xl font-bold mb-4'>Invalid or expired invitation</h1>
        <p className='text-gray-600'>
          This invitation link is no longer valid. Please contact the presentation submitter if you
          believe this is an error.
        </p>
      </main>
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/copresenter-invite/${token}`);
  }

  if (user.id !== payload.presenterId) {
    return (
      <main className='mx-auto max-w-lg py-12 px-4'>
        <h1 className='text-2xl font-bold mb-4'>Wrong account</h1>
        <p className='text-gray-600'>
          This invitation is for a different account. Please sign in with the correct account to
          respond to this invitation.
        </p>
      </main>
    );
  }

  const supabaseAdmin = createAdminClient();

  const [{ data: presentation }, { data: presenterRow }] = await Promise.all([
    supabaseAdmin
      .from('presentation_submissions')
      .select('title, presentation_type')
      .eq('id', payload.presentationId)
      .single(),
    supabaseAdmin
      .from('presentation_presenters')
      .select('status')
      .eq('presentation_id', payload.presentationId)
      .eq('presenter_id', payload.presenterId)
      .single()
  ]);

  if (!presentation) {
    return (
      <main className='mx-auto max-w-lg py-12 px-4'>
        <h1 className='text-2xl font-bold mb-4'>Presentation not found</h1>
        <p className='text-gray-600'>
          The presentation associated with this invitation could not be found.
        </p>
      </main>
    );
  }

  const alreadyResponded =
    presenterRow?.status === 'accepted' || presenterRow?.status === 'declined';

  return (
    <main className='mx-auto max-w-lg py-12 px-4'>
      <h1 className='text-2xl font-bold mb-2'>Co-presenter invitation</h1>
      <p className='text-gray-600 mb-6'>You have been invited to co-present at GLA Summit.</p>

      <div className='rounded-md border p-4 mb-6'>
        <p className='text-sm text-gray-500 uppercase font-semibold mb-1'>Presentation</p>
        <p className='text-lg font-medium'>{presentation.title}</p>
      </div>

      {alreadyResponded ? (
        <div className='rounded-md border p-4 text-center'>
          <p className='text-gray-600'>
            You have already{' '}
            <strong>
              {presenterRow?.status === 'accepted' ? 'accepted' : 'declined'}
            </strong>{' '}
            this invitation.
          </p>
        </div>
      ) : (
        <CopresenterResponseButtons token={token} />
      )}
    </main>
  );
};

export default CopresenterInvitePage;

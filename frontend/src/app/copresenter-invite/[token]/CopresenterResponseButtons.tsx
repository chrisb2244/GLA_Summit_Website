'use client';

import { useActionState } from 'react';
import { submitInviteResponse, type RespondToInviteResult } from './actions';

type Props = {
  token: string;
};

export const CopresenterResponseButtons = ({ token }: Props) => {
  const [result, formAction, isPending] = useActionState(submitInviteResponse, null);

  if (result?.success) {
    const accepted = result.action === 'accept';
    return (
      <div className='mt-6 rounded-md border p-4 text-center'>
        <p className='text-lg font-semibold'>
          {accepted ? 'You have accepted the invitation.' : 'You have declined the invitation.'}
        </p>
        <p className='mt-2 text-sm text-gray-600'>
          {accepted
            ? 'The presentation submitter has been notified. Thank you!'
            : 'The presentation submitter has been notified.'}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type='hidden' name='token' value={token} />
      {result && !result.success && (
        <p className='mb-4 text-center text-red-600'>{result.error}</p>
      )}
      <div className='flex gap-4 justify-center'>
        <button
          type='submit'
          name='action'
          value='accept'
          disabled={isPending}
          className='rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50'
        >
          {isPending ? 'Submitting...' : 'Accept invitation'}
        </button>
        <button
          type='submit'
          name='action'
          value='decline'
          disabled={isPending}
          className='rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:opacity-50'
        >
          {isPending ? 'Submitting...' : 'Decline invitation'}
        </button>
      </div>
    </form>
  );
};

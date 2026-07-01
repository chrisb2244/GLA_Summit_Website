'use client';

import { useState, useTransition } from 'react';
import { CenteredDialog } from '@/Components/CenteredDialog';
import {
  forceSubmissionOutcome,
  type ForceOutcome
} from './actions';

export type ForceConclusionPanelProps = {
  presentationId: string;
  title: string;
};

const OUTCOME_LABELS: Record<ForceOutcome, string> = {
  accepted: 'accept',
  declined: 'decline'
};

/**
 * Buttons letting an allow-listed organizer force an early accept/decline. Each
 * action opens a CenteredDialog confirmation (the outcome is irreversible) to
 * prevent misclicks. Only rendered for under-review submissions and only when the
 * signed-in user is a concluder (gated by the parent page).
 */
export const ForceConclusionPanel: React.FC<ForceConclusionPanelProps> = ({
  presentationId,
  title
}) => {
  const [pending, setPending] = useState<ForceOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (!isPending) {
      setPending(null);
    }
  };

  const confirm = () => {
    if (pending === null) {
      return;
    }
    const outcome = pending;
    setError(null);
    startTransition(async () => {
      const result = await forceSubmissionOutcome(presentationId, outcome);
      if (result.success) {
        setPending(null);
      } else {
        setError(result.error ?? 'Something went wrong.');
      }
    });
  };

  return (
    <div className='mt-2'>
      <div className='flex flex-row items-center gap-2'>
        <span className='text-xs uppercase text-gray-500'>Force outcome:</span>
        <button
          type='button'
          onClick={() => {
            setError(null);
            setPending('accepted');
          }}
          className='rounded-md bg-green-50 px-3 py-1 text-sm ring-1 ring-green-300 hover:bg-green-100'
        >
          Force accept
        </button>
        <button
          type='button'
          onClick={() => {
            setError(null);
            setPending('declined');
          }}
          className='rounded-md bg-red-50 px-3 py-1 text-sm ring-1 ring-red-300 hover:bg-red-100'
        >
          Force decline
        </button>
      </div>

      <CenteredDialog open={pending !== null} onClose={close}>
        {pending !== null && (
          <div className='flex flex-col gap-4'>
            <h2 className='text-lg font-semibold'>
              {`Force ${OUTCOME_LABELS[pending]} this submission?`}
            </h2>
            <p className='text-sm text-gray-700'>
              {`You are about to force-${OUTCOME_LABELS[pending]} `}
              <span className='font-medium'>{`"${title}"`}</span>
              {
                ', overriding the organizer vote. This is irreversible: the outcome will be locked, presenters will be emailed, and voting will close.'
              }
            </p>
            {error && <p className='text-sm text-red-700'>{error}</p>}
            <div className='flex flex-row justify-end gap-2'>
              <button
                type='button'
                onClick={close}
                disabled={isPending}
                className='rounded-md px-3 py-1 text-sm ring-1 ring-gray-300 hover:bg-gray-100 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={confirm}
                disabled={isPending}
                className={
                  pending === 'accepted'
                    ? 'rounded-md bg-green-600 px-3 py-1 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50'
                    : 'rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50'
                }
              >
                {isPending
                  ? 'Working…'
                  : `Force ${OUTCOME_LABELS[pending]}`}
              </button>
            </div>
          </div>
        )}
      </CenteredDialog>
    </div>
  );
};

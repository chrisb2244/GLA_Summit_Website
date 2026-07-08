'use client';

import { Disclosure, Transition } from '@headlessui/react';
import { cva } from 'class-variance-authority';
import { startTransition, useOptimistic } from 'react';
import type {
  OrganizerDirectoryEntry,
  OrganizerVote
} from '@/lib/databaseModels';
import { ORGANIZER_VOTING } from '@/app/configConstants';
import { joinNames } from '@/lib/utils';
import { castVote } from './actions';

export type SubmissionVotingPanelProps = {
  presentationId: string;
  /** The signed-in organizer's id, or null if not signed in. */
  currentUserId: string | null;
  /** Every organizer, for the full vote record. */
  organizers: OrganizerDirectoryEntry[];
  /** This submission's votes. */
  votes: { organizer_id: string; vote: OrganizerVote }[];
  /** Which bucket the submission is in. Voting is only allowed under review. */
  status: 'under-review' | 'accepted' | 'declined';
};

const VOTE_OPTIONS: OrganizerVote[] = ['for', 'abstain', 'against'];

const VOTE_LABELS: Record<OrganizerVote, string> = {
  for: 'For',
  abstain: 'Abstain',
  against: 'Against'
};

const buttonStyle = cva(
  'rounded-md px-3 py-1 text-sm ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      active: { true: 'font-semibold', false: 'opacity-70 hover:opacity-100' },
      vote: { for: '', abstain: '', against: '' }
    },
    compoundVariants: [
      { active: true, vote: 'for', className: 'bg-green-200 ring-green-500' },
      { active: true, vote: 'abstain', className: 'bg-yellow-200 ring-yellow-500' },
      { active: true, vote: 'against', className: 'bg-red-200 ring-red-500' },
      { active: false, vote: 'for', className: 'bg-green-50 ring-green-200' },
      { active: false, vote: 'abstain', className: 'bg-yellow-50 ring-yellow-200' },
      { active: false, vote: 'against', className: 'bg-red-50 ring-red-200' }
    ]
  }
);

const badgeStyle = cva('rounded px-2 py-0.5 text-xs font-medium', {
  variants: {
    vote: {
      for: 'bg-green-100 text-green-800',
      abstain: 'bg-yellow-100 text-yellow-800',
      against: 'bg-red-100 text-red-800',
      none: 'bg-gray-100 italic text-gray-500'
    }
  }
});

export const SubmissionVotingPanel: React.FC<SubmissionVotingPanelProps> = ({
  presentationId,
  currentUserId,
  organizers,
  votes,
  status
}) => {
  const serverVote =
    votes.find((v) => v.organizer_id === currentUserId)?.vote ?? null;

  const [optimisticVote, setOptimisticVote] = useOptimistic<
    OrganizerVote | null,
    OrganizerVote | null
  >(serverVote, (_current, next) => next);

  const isOrganizer =
    currentUserId !== null &&
    organizers.some((o) => o.id === currentUserId);
  const canVote = status === 'under-review' && ORGANIZER_VOTING && isOrganizer;

  const onVote = (vote: OrganizerVote) => {
    // Clicking the active choice clears it.
    const next = vote === optimisticVote ? null : vote;
    startTransition(async () => {
      setOptimisticVote(next);
      await castVote(presentationId, next);
    });
  };

  // The vote shown for each organizer, with the current user's row reflecting
  // their optimistic vote so the record updates immediately.
  const voteFor = (organizerId: string): OrganizerVote | null => {
    if (organizerId === currentUserId) {
      return optimisticVote;
    }
    return votes.find((v) => v.organizer_id === organizerId)?.vote ?? null;
  };

  const votedCount = organizers.filter(
    (o) => voteFor(o.id) !== null
  ).length;

  return (
    <div className='mt-2'>
      {canVote && (
        <div className='flex flex-row gap-2'>
          {VOTE_OPTIONS.map((vote) => (
            <button
              key={vote}
              type='button'
              onClick={() => onVote(vote)}
              className={buttonStyle({ active: optimisticVote === vote, vote })}
            >
              {VOTE_LABELS[vote]}
            </button>
          ))}
        </div>
      )}

      <Disclosure>
        <Disclosure.Button className='mt-2 text-sm text-blue-700 underline'>
          {`Vote record (${votedCount}/${organizers.length})`}
        </Disclosure.Button>
        <Transition>
          <Disclosure.Panel className='mt-1 rounded-md bg-gray-50 p-2'>
            <ul className='space-y-1'>
              {organizers.map((organizer) => {
                const vote = voteFor(organizer.id);
                return (
                  <li
                    key={organizer.id}
                    className='flex flex-row items-center justify-between text-sm'
                  >
                    <span>
                      {joinNames(organizer)}
                      {organizer.id === currentUserId ? ' (you)' : ''}
                    </span>
                    <span className={badgeStyle({ vote: vote ?? 'none' })}>
                      {vote ? VOTE_LABELS[vote] : 'Not voted'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
};

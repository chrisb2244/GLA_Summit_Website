import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from './SubmittedPresentationReviewCard';
import { createServerClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/app/configConstants';
import { DownloadButton } from './DownloadButton';
import { SubmissionVotingPanel } from './SubmissionVotingPanel';
import { getUser } from '@/lib/supabase/userFunctions';
import { Suspense } from 'react';
import type {
  OrganizerDirectoryEntry,
  OrganizerVote,
  ReviewableSubmissions
} from '@/lib/databaseModels';

const ReviewSubmissionsPage = () => {
  return (
    <Suspense fallback={<p>Loading review submissions...</p>}>
      <ReviewSubmissionsPageContent />
    </Suspense>
  );
};

export const mapSubmittedPresentations = (
  data: ReviewableSubmissions | null,
  hasError: boolean
): PresentationReviewInfo[] => {
  if (hasError || !data) {
    return [];
  }

  // Defensive filter: exclude drafts if an environment still has an older RPC
  // implementation that does not enforce is_submitted=true server-side.
  return data
    .filter((d) => {
      return (
        // Doesn't have the property - should be submitted
        !d.hasOwnProperty('is_submitted') ||
        // Has the property and is true
        (d as ReviewableSubmissions[number] & { is_submitted: boolean })
          .is_submitted !== false
      );
    })
    .map((d) => {
      const presenters = (d.presenters ?? []).map((p) => ({
        id: p.id ?? '',
        firstname: p.firstname ?? '',
        lastname: p.lastname ?? ''
      }));
      const submitter = presenters.find((p) => p.id === d.submitter_id) ?? {
        id: d.submitter_id ?? '',
        firstname: 'Unknown',
        lastname: 'User'
      };

      return {
        ...d,
        learning_points: d.learning_points ?? '',
        presenters,
        submitter
      };
    });
};

export type SubmissionBucket = 'under-review' | 'accepted' | 'declined';

/**
 * Split submissions into the three review buckets based on the outcome tables,
 * keeping each list sorted by most recently updated first. A submission is
 * accepted/declined if its id appears in the respective outcome set; otherwise it
 * is still under review.
 */
export const bucketSubmissions = (
  submissions: PresentationReviewInfo[],
  acceptedIds: Set<string>,
  declinedIds: Set<string>
): Record<SubmissionBucket, PresentationReviewInfo[]> => {
  const buckets: Record<SubmissionBucket, PresentationReviewInfo[]> = {
    'under-review': [],
    accepted: [],
    declined: []
  };

  for (const submission of submissions) {
    if (acceptedIds.has(submission.presentation_id)) {
      buckets.accepted.push(submission);
    } else if (declinedIds.has(submission.presentation_id)) {
      buckets.declined.push(submission);
    } else {
      buckets['under-review'].push(submission);
    }
  }

  const byUpdatedDesc = (
    a: PresentationReviewInfo,
    b: PresentationReviewInfo
  ) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  buckets['under-review'].sort(byUpdatedDesc);
  buckets.accepted.sort(byUpdatedDesc);
  buckets.declined.sort(byUpdatedDesc);

  return buckets;
};

export const ReviewSubmissionsPageContent = async () => {
  const supabase = await createServerClient();
  const user = await getUser();

  const [
    { data, error },
    { data: downloadInfo },
    { data: voteRows },
    { data: organizerRows },
    { data: acceptedRows },
    { data: rejectedRows }
  ] = await Promise.all([
    supabase.rpc('get_reviewable_submissions', {
      target_year: submissionsForYear
    }),
    supabase
      .from('review_download_information')
      .select('presentation_id, last_downloaded'),
    supabase
      .from('submission_votes')
      .select('presentation_id, organizer_id, vote'),
    supabase.rpc('get_organizer_directory'),
    supabase
      .from('accepted_presentations')
      .select('id')
      .eq('year', submissionsForYear),
    supabase.from('rejected_presentations').select('id')
  ]);

  const submittedPresentations = mapSubmittedPresentations(
    data,
    Boolean(error)
  );

  const acceptedIds = new Set((acceptedRows ?? []).map((r) => r.id));
  const declinedIds = new Set((rejectedRows ?? []).map((r) => r.id));
  const organizers: OrganizerDirectoryEntry[] = organizerRows ?? [];
  const votes = voteRows ?? [];

  const buckets = bucketSubmissions(
    submittedPresentations,
    acceptedIds,
    declinedIds
  );

  const renderCard = (
    p: PresentationReviewInfo,
    status: SubmissionBucket
  ) => {
    const lastDownloadedInfo = downloadInfo?.find(
      (d) => d.presentation_id === p.presentation_id
    )?.last_downloaded;
    const lastDownloaded = lastDownloadedInfo
      ? new Date(lastDownloadedInfo)
      : null;
    const presentationVotes = votes
      .filter((v) => v.presentation_id === p.presentation_id)
      .map((v) => ({
        organizer_id: v.organizer_id,
        vote: v.vote as OrganizerVote
      }));

    return (
      <div
        key={p.presentation_id}
        className='flex flex-row space-x-2 rounded-md border p-2'
      >
        <div className='flex w-3/4 flex-col'>
          <SubmittedPresentationReviewCard presentationInfo={p} />
          <SubmissionVotingPanel
            presentationId={p.presentation_id}
            currentUserId={user?.id ?? null}
            organizers={organizers}
            votes={presentationVotes}
            status={status}
          />
        </div>
        <DownloadButton
          lastDownloaded={lastDownloaded}
          presentationId={p.presentation_id}
        />
      </div>
    );
  };

  const sections: { title: string; status: SubmissionBucket }[] = [
    { title: 'Under review', status: 'under-review' },
    { title: 'Accepted', status: 'accepted' },
    { title: 'Declined', status: 'declined' }
  ];

  return (
    <div className='mx-auto mt-4 w-full max-w-(--breakpoint-lg)'>
      <p className='prose mx-auto text-center'>
        {`${submittedPresentations.length} submitted presentations`}
      </p>
      {sections.map(({ title, status }) => (
        <section key={status} className='mt-6'>
          <h2 className='mb-2 text-lg font-semibold'>
            {`${title} (${buckets[status].length})`}
          </h2>
          {buckets[status].length === 0 ? (
            <p className='text-sm italic text-gray-500'>None.</p>
          ) : (
            <div className='flex flex-col space-y-2'>
              {buckets[status].map((p) => renderCard(p, status))}
            </div>
          )}
        </section>
      ))}

      <details className='mt-8 rounded-lg border border-gray-200 bg-gray-50'>
        <summary className='cursor-pointer select-none px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900'>
          Voting rules
        </summary>
        <div className='px-4 pb-4 pt-2 text-sm text-gray-700'>
          <p className='mb-2'>
            Outcomes are decided automatically after each vote is cast or changed.
          </p>
          <ul className='space-y-2'>
            <li>
              <span className='font-semibold text-green-700'>Accept</span>
              {' — all organizers have voted, at least one "for", and zero "against".'}
              <span className='ml-1 text-gray-500'>(Full participation required.)</span>
            </li>
            <li>
              <span className='font-semibold text-red-700'>Decline</span>
              {' — a "for" majority is no longer achievable: '}
              <span className='font-mono'>2 × against + abstain &gt; total organizers</span>
              {'. An abstain is treated as a committed non-"for" vote; only unvoted organizers can still swing "for".'}
              <span className='ml-1 text-gray-500'>(Does not require full participation.)</span>
            </li>
            <li>
              <span className='font-semibold text-gray-700'>Under review</span>
              {' — neither condition is met yet.'}
            </li>
          </ul>
          <p className='mt-2 text-gray-500'>
            Once accepted or declined, votes are locked and the outcome cannot be reversed.
          </p>
        </div>
      </details>
    </div>
  );
};

export default ReviewSubmissionsPage;

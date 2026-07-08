import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from './SubmittedPresentationReviewCard';
import { createServerClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/app/configConstants';
import { DownloadButton } from './DownloadButton';
import { Suspense } from 'react';
import type { ReviewableSubmissions } from '@/lib/databaseModels';

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

export const ReviewSubmissionsPageContent = async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_reviewable_submissions', {
    target_year: submissionsForYear
  });

  const submittedPresentations = mapSubmittedPresentations(
    data,
    Boolean(error)
  );

  const { data: downloadInfo } = await supabase
    .from('review_download_information')
    .select('presentation_id, last_downloaded');

  const listElems = submittedPresentations
    .sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    })
    .map((p) => {
      const lastDownloadedInfo = downloadInfo?.find(
        (d) => d.presentation_id === p.presentation_id
      )?.last_downloaded;
      const lastDownloaded = lastDownloadedInfo
        ? new Date(lastDownloadedInfo)
        : null;

      return (
        <div
          key={p.presentation_id}
          className='flex flex-row space-x-2 rounded-md border p-2'
        >
          <div className='flex w-3/4'>
            <SubmittedPresentationReviewCard presentationInfo={p} />
          </div>
          <DownloadButton
            lastDownloaded={lastDownloaded}
            presentationId={p.presentation_id}
          />
        </div>
      );
    });

  return (
    <div className='mx-auto mt-4 w-full max-w-(--breakpoint-lg)'>
      <p className='prose mx-auto text-center'>
        {`Here's a list of ${submittedPresentations.length} presentations!!!`}
      </p>
      <div className='flex flex-col space-y-2'>{listElems}</div>
    </div>
  );
};

export default ReviewSubmissionsPage;

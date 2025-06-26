import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from './SubmittedPresentationReviewCard';
import { createServerClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/app/configConstants';
import { dateToDateArray } from '@/lib/utils';
import { DownloadButton } from './DownloadButton';

const ReviewSubmissionsPage = async () => {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_reviewable_submissions', {
    target_year: submissionsForYear
  });

  const { data: downloadInfo, error: downloadInfoError } = await supabase
    .from('review_download_information')
    .select('*');

  const submittedPresentations: PresentationReviewInfo[] = error
    ? []
    : data.map((d) => {
        return {
          ...d,
          submitter: d.presenters.filter((p) => p.id === d.submitter_id)[0]
        };
      });

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
    <div className='mx-auto mt-4 w-full max-w-screen-lg'>
      <p className='prose mx-auto text-center'>
        {`Here's a list of ${submittedPresentations.length} presentations!!!`}
      </p>
      <div className='flex flex-col space-y-2'>{listElems}</div>
    </div>
  );
};

export default ReviewSubmissionsPage;

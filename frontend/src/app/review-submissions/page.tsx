import {
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from '@/Components/SubmittedPresentationReviewCard';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { submissionsForYear } from '@/lib/databaseModels';

const ReviewSubmissionsPage = async () => {
  const supabase = createServerComponentClient();
  const { data, error } = await supabase.rpc('get_reviewable_submissions', {
    target_year: submissionsForYear
  });

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
      return (
        <SubmittedPresentationReviewCard
          presentationInfo={p}
          key={p.presentation_id}
        />
      );
    });

  return (
    <div className='mx-auto mt-4'>
      <p className='prose text-center'>
        {`Here's a list of ${submittedPresentations.length} presentations!!!`}
      </p>
      <div className='flex flex-col space-y-1'>{listElems}</div>
    </div>
  );
};

export default ReviewSubmissionsPage;

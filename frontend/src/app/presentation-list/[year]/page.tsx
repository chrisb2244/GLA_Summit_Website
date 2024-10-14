import {
  Presentation,
  PresentationSummary,
  Presenter
} from '@/Components/PresentationSummary';
import { createAnonServerClient } from '@/lib/supabaseClient';
import {
  sortPresentationsByPresenterName,
  sortPresentationsBySchedule
} from '@/lib/utils';
import type { NextParams, satisfy } from '@/lib/NextTypes';

type PageProps = {
  params: satisfy<NextParams, Promise<{ year: string }>>;
};

export const revalidate = 600;

const PresentationsForYearPage = async (props: PageProps) => {
  const { year } = await props.params;
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from('all_presentations')
    .select()
    .eq('year', year);
  if (error) {
    return <p>Error loading presentations</p>;
  }

  const presentations = data
    .map((p) => {
      const presenters = p.all_presenters_names.map((_, idx) => {
        const presenter: Presenter = {
          firstname: p.all_presenter_firstnames[idx],
          lastname: p.all_presenter_lastnames[idx]
        };
        return presenter;
      });
      const presentation: Presentation = {
        ...p, // title, abstract, year
        speakers: presenters,
        speakerNames: p.all_presenters_names,
        presentationId: p.presentation_id,
        presentationType: p.presentation_type,
        // Mask the schedule for 2024 for now
        scheduledFor: p.year === '2024' ? null : p.scheduled_for
      };
      return presentation;
    })
    .sort((a, b) => {
      const sortByName = true;
      const bySchedule = sortPresentationsBySchedule(a, b);
      const byName = sortPresentationsByPresenterName(a, b);
      if (sortByName) {
        return byName !== 0 ? byName : bySchedule;
      } else {
        return bySchedule !== 0 ? bySchedule : byName;
      }
    })
    .map((p) => {
      return (
        <div key={p.title}>
          <PresentationSummary presentation={p} />
        </div>
      );
    });

  return (
    <>
      <h3 className='py-1 pt-4 text-center'>{year} Presentations</h3>
      <div className='mx-4 flex flex-col space-y-4 pb-4'>{presentations}</div>
    </>
  );
};

export default PresentationsForYearPage;

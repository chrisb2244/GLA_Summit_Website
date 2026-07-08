import {
  Presentation,
  PresentationSummary,
  Presenter
} from '@/Components/PresentationSummary';
import { SectionHeading } from '@/Components/Typography';
import { createAnonServerClient } from '@/lib/supabaseClient';
import {
  sortPresentationsByPresenterName,
  sortPresentationsBySchedule
} from '@/lib/utils';
import type { NextParams, satisfy } from '@/lib/NextTypes';
import { isSummitYear, summityears, SummitYear } from '@/lib/databaseModels';
import { cacheTagForYear } from '@/lib/supabase/cacheTags';
import { cacheLife, cacheTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

type PageProps = {
  params: satisfy<NextParams, Promise<{ year: string }>>;
};

// Prerender the known summit years at build time. Without this the [year]
// route is rendered on-demand, where the 'use cache' store is a per-instance
// in-memory LRU that doesn't persist across serverless requests — so every
// visit re-ran the DB query. Prerendering serves static HTML and lets the
// existing cacheTag/webhook revalidation refresh it via ISR.
export function generateStaticParams() {
  return summityears.map((year) => ({ year }));
}

const PresentationsForYearPage = async (props: PageProps) => {
  // Validate the param outside the cached scope so the cache boundary only
  // ever sees a known SummitYear, and the redirect doesn't run inside cache.
  const { year } = await props.params;
  if (!isSummitYear(year)) {
    redirect('/presentation-list');
  }

  return (
    <Suspense fallback={<p>Loading presentations...</p>}>
      <PresentationsForYearPageContent year={year} />
    </Suspense>
  );
};

const PresentationsForYearPageContent = async ({
  year
}: {
  year: SummitYear;
}) => {
  'use cache';
  cacheLife('publicContent');
  cacheTag(cacheTagForYear(year));

  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .rpc('get_all_presentations')
    .eq('year', year)
    .select('*');

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
        // Mask the schedule for 2025 for now
        scheduledFor: p.year === '2025' ? null : p.scheduled_for
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

  if (presentations.length === 0) {
    return (
      <>
        <SectionHeading>{year} Presentations</SectionHeading>
        <p className='py-4 text-center'>
          No presentations to show for {year} yet — check back soon.
        </p>
      </>
    );
  }

  return (
    <>
      <SectionHeading>{year} Presentations</SectionHeading>
      <div className='mx-4 flex flex-col space-y-2 pb-4'>{presentations}</div>
    </>
  );
};

export default PresentationsForYearPage;

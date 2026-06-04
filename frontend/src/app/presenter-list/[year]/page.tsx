import { PersonDisplay } from '@/Components/PersonDisplay';
import { getAcceptedPresenterIds, getPeople } from '@/lib/supabase/public';
import { CACHE_TAGS, cacheTagForPerson } from '@/lib/supabase/cacheTags';
import type { NextParams, satisfy } from '@/lib/NextTypes';
import { isSummitYear, summityears, SummitYear } from '@/lib/databaseModels';
import { cacheLife, cacheTag } from 'next/cache';
import { Route } from 'next';
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

const PresentersForYearPage = async (props: PageProps) => {
  // Validate the param outside the cached scope so the cache boundary only
  // ever sees a known SummitYear, and the redirect doesn't run inside cache.
  const { year } = await props.params;
  if (!isSummitYear(year)) {
    redirect('/presenter-list');
  }

  return (
    <Suspense fallback={<p>Loading presenters...</p>}>
      <PresentersForYearPageContent year={year} />
    </Suspense>
  );
};

const nameSorter = (a: string, b: string) => a.localeCompare(b);

const PresentersForYearPageContent = async ({
  year
}: {
  year: SummitYear;
}) => {
  'use cache';
  cacheLife('publicContent');
  // Re-fetch when the set of accepted presenters for the year changes (the
  // webhook in /api/revalidate emits this tag on an acceptance change).
  cacheTag(`${CACHE_TAGS.acceptedPresenterIds}:${year}`);

  const presenterIds = await getAcceptedPresenterIds(year);
  // Per-person tags so a profile edit invalidates the year(s) they appear in.
  presenterIds.forEach((id) => cacheTag(cacheTagForPerson(id)));

  const peopleWithNames = (await getPeople(presenterIds))
    .filter((person) => person.firstName && person.lastName)
    .sort((a, b) => nameSorter(a.lastName, b.lastName));

  if (peopleWithNames.length === 0) {
    return (
      <>
        <h3 className='py-1 pt-4 text-center'>{year} Presenters</h3>
        <p className='py-4 text-center'>
          No presenters to show for {year} yet — check back soon.
        </p>
      </>
    );
  }

  const presenterElements = peopleWithNames.map(({ id, ...person }) => {
    return (
      <div className='border p-4 shadow-sm [&_p]:line-clamp-6' key={id}>
        <PersonDisplay
          {...person}
          pageLink={`/presenters/${id}` as Route}
          useDefaultIconImage
          stripContainer
        />
      </div>
    );
  });

  return (
    <>
      <h3 className='py-1 pt-4 text-center'>{year} Presenters</h3>
      <div className='mx-4 flex flex-col space-y-2 pb-4'>
        {presenterElements}
      </div>
    </>
  );
};

export default PresentersForYearPage;

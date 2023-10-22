import { getMyPresentations } from '@/lib/databaseFunctions';
import {
  MyPresentationSubmissionType,
  SummitYear,
  submissionsForYear
} from '@/lib/databaseModels';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { formatTextToPs } from '@/lib/utils';
import { Metadata } from 'next';
import NextLink from 'next/link';

export const metadata: Metadata = {
  robots: {
    index: false
  }
};

const MyPresentationsPage = async () => {
  const supabase = createServerComponentClient();

  // const {
  //   data: { user },
  //   error
  // } = await supabase.auth.getUser();
  // if (error) {
  //   console.error({ m: 'Error fetching user', error });
  // }

  const myPresentations = await getMyPresentations(supabase);
  const { submittedPresentations, draftPresentations } = myPresentations.reduce(
    ({ submittedPresentations, draftPresentations }, elem) => {
      if (elem.is_submitted) {
        return {
          submittedPresentations: [...submittedPresentations, elem],
          draftPresentations
        };
      } else {
        return {
          submittedPresentations,
          draftPresentations: [...draftPresentations, elem]
        };
      }
    },
    {
      submittedPresentations: new Array<MyPresentationSubmissionType>(),
      draftPresentations: new Array<MyPresentationSubmissionType>()
    }
  );

  const activeDrafts = draftPresentations.filter(
    (p) => p.year === submissionsForYear
  );
  const draftEntries =
    activeDrafts.length === 0 ? (
      <div>
        <p>You have no active draft submissions</p>
      </div>
    ) : (
      activeDrafts.map((p) => {
        return (
          <div key={p.presentation_id}>
            <h4>{p.title}</h4>
          </div>
        );
      })
    );

  const presentationsByYear = submittedPresentations.reduce(
    (existingSet, newElem) => {
      return Object.assign(existingSet, {
        [newElem.year]: (existingSet[newElem.year] || []).concat(newElem)
      });
    },
    {} as Record<SummitYear, MyPresentationSubmissionType[]>
  );
  const years = Object.keys(presentationsByYear) as SummitYear[];
  years.sort((a, b) => {
    const aN = Number.parseInt(a);
    const bN = Number.parseInt(b);
    return aN === bN ? 0 : aN > bN ? -1 : 1;
  });

  const renderPresentationSubmission = (p: MyPresentationSubmissionType) => {
    return (
      <div
        key={p.presentation_id}
        className='relative left-4 border border-secondaryc p-2'
      >
        <div className='flex flex-col md:flex-row'>
          <h5>
            <NextLink
              className='link'
              href={`/presentations/${p.presentation_id}`}
            >
              {p.title}
            </NextLink>
          </h5>
          <span className='md:pl-2'>({p.presentation_type})</span>
        </div>
        <div className='[&>p]:my-1'>{formatTextToPs(p.abstract)}</div>
      </div>
    );
  };

  const pastPresentationSubmissions =
    years.length > 0 ? (
      <div className='flex flex-col space-y-2'>
        {years.map((y) => {
          const presentationsInYear = presentationsByYear[y];
          return (
            <div key={y} className='flex flex-col space-y-1'>
              <h4 className='my-1'>{y}</h4>
              {presentationsInYear.map((p) => renderPresentationSubmission(p))}
            </div>
          );
        })}
      </div>
    ) : (
      <div>
        <p>You do not have any previous submissions</p>
      </div>
    );

  return (
    <div className='prose mx-auto max-w-none'>
      <div>
        <p>The presentation submission page is currently being reworked!</p>
        <p>We look forwards to being able to accept submissions soon.</p>
      </div>

      <div>
        <h3>Draft Submissions</h3>
        {draftEntries}
      </div>

      <div>
        <h3>Submitted Presentations</h3>
        {pastPresentationSubmissions}
      </div>
    </div>
  );
};

export default MyPresentationsPage;

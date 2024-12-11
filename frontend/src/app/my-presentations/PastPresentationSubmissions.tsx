import { createServerClient } from '@/lib/supabaseServer';
import type {
  MyPresentationSubmissionType,
  SummitYear
} from '@/lib/databaseModels';
import { getMyPresentations } from '@/lib/databaseFunctions';
import NextLink from 'next/link';
import { formatTextToPs } from '@/lib/utils';

export const PastPresentationSubmissions = async () => {
  const supabase = await createServerClient();

  const myPresentations = await getMyPresentations(supabase);
  const myPresentationIds = myPresentations.map((p) => p.presentation_id);
  const acceptedList = (
    (
      await supabase
        .from('accepted_presentations')
        .select('id')
        .in('id', myPresentationIds)
    ).data ?? []
  ).map((v) => v.id);
  const rejectedList = (
    (
      await supabase
        .from('rejected_presentations')
        .select('id')
        .in('id', myPresentationIds)
    ).data ?? []
  ).map((v) => v.id);

  const { submittedPresentations } = myPresentations.reduce(
    ({ submittedPresentations, draftPresentations }, elem) => {
      const accepted = formatAccepted(
        elem.presentation_id,
        acceptedList,
        rejectedList
      );
      if (elem.is_submitted) {
        return {
          submittedPresentations: [
            ...submittedPresentations,
            { ...elem, accepted }
          ],
          draftPresentations
        };
      } else {
        return {
          submittedPresentations,
          draftPresentations: [...draftPresentations, { ...elem, accepted }]
        };
      }
    },
    {
      submittedPresentations:
        new Array<MyPresentationSubmissionTypeWithAccepted>(),
      draftPresentations: new Array<MyPresentationSubmissionTypeWithAccepted>()
    }
  );

  const presentationsByYear = submittedPresentations.reduce(
    (existingSet, newElem) => {
      return Object.assign(existingSet, {
        [newElem.year]: (existingSet[newElem.year] || []).concat(newElem)
      });
    },
    {} as Record<SummitYear, MyPresentationSubmissionTypeWithAccepted[]>
  );
  const years = Object.keys(presentationsByYear) as SummitYear[];
  years.sort((a, b) => {
    const aN = Number.parseInt(a);
    const bN = Number.parseInt(b);
    return aN === bN ? 0 : aN > bN ? -1 : 1;
  });

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

  return pastPresentationSubmissions;
};

export const PastPresentationSubmissionsFallback = () => {
  return <div className='flex min-h-14 animate-pulse bg-gray-200'></div>;
};

type Acceptance = 'Accepted' | 'Withdrawn/Declined' | null;
type MyPresentationSubmissionTypeWithAccepted = MyPresentationSubmissionType & {
  accepted: Acceptance;
};

const formatAccepted = (
  id: string,
  acceptedList: string[],
  rejectedList: string[]
): Acceptance => {
  return acceptedList.includes(id)
    ? 'Accepted'
    : rejectedList.includes(id)
    ? 'Withdrawn/Declined'
    : null;
};

const renderPresentationSubmission = (
  p: MyPresentationSubmissionTypeWithAccepted
) => {
  return (
    <div
      key={p.presentation_id}
      aria-label={p.title}
      className='relative left-4 mr-6 border border-secondaryc p-2'
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
        <span className='italic md:ml-auto md:mr-1'>
          {p.accepted ?? 'Under consideration'}
        </span>
      </div>
      <div className='[&>p]:my-1'>{formatTextToPs(p.abstract)}</div>
    </div>
  );
};

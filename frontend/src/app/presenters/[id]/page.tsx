import { PersonDisplay } from '@/Components/PersonDisplay';
import { LinkLikeText } from '@/Components/Utilities/LinkLikeText';
import {
  getPerson,
  getPublicPresentations,
  getPublicPresentationsForPresenter
} from '@/lib/databaseFunctions';
import { splitByYear } from '@/lib/presentationArrayFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { NextPage } from 'next';
import { notFound } from 'next/navigation';

type PageProps = {
  params: {
    id: string;
  };
};

export const revalidate = 600;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const supabase = createAnonServerClient();
  return await getPublicPresentations(supabase).then((presentationsData) => {
    return presentationsData.flatMap((d) => {
      return d.all_presenters.map((presenterId) => {
        return {
          id: presenterId
        };
      });
    });
  });
}

const PresentersPage: NextPage<PageProps> = async ({ params }) => {
  const presenterId = params.id;
  if (typeof presenterId !== 'string') {
    notFound();
  }

  const supabase = createAnonServerClient();

  try {
    const presenter = await getPerson(presenterId, supabase);
    const presenterPresentations = await getPublicPresentationsForPresenter(
      presenterId,
      supabase
    );

    const presentationsByYear = splitByYear(presenterPresentations);
    const presentationElements = presentationsByYear.map(
      ([year, presentationsInYear]) => {
        return (
          <div key={year} className='mt-4 md:mt-0'>
            <h4 className='text-xl'>{year}</h4>
            <div className='flex flex-col'>
            {presentationsInYear.map((p) => {
              return (
                <LinkLikeText
                  href={`/presentations/${p.presentation_id}`}
                  className='ml-2 text-lg'
                  key={p.presentation_id}
                >
                  {p.title}
                </LinkLikeText>
              );
            })}
            </div>
          </div>
        );
      }
    );

    return (
      <div className='my-4 prose max-w-none'>
        <PersonDisplay {...presenter} stripContainer />
        {presentationElements}
      </div>
    );
  } catch (e) {
    notFound();
  }
};

export default PresentersPage;

import { PersonDisplay } from '@/Components/PersonDisplay';
import type { NextParams, satisfy } from '@/lib/NextTypes';
import { getPublicPresentationsForPresenter } from '@/lib/databaseFunctions';
import { splitByYear } from '@/lib/presentationArrayFunctions';
import { getAcceptedPresenterIds, getPerson } from '@/lib/supabase/public';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { Metadata, NextPage } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: satisfy<
    NextParams,
    Promise<{
      id: string;
    }>
  >;
};

export const revalidate = 600;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return (await getAcceptedPresenterIds()).map((id) => {
    return {
      id
    };
  });
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const supabase = createAnonServerClient();
    const { firstName, lastName } = await getPerson(id);

    return { title: `${firstName} ${lastName}` };
  } catch (error) {
    return {};
  }
}

const PresentersPage: NextPage<PageProps> = async (props) => {
  const presenterId = (await props.params).id;
  if (typeof presenterId !== 'string') {
    notFound();
  }

  const supabase = createAnonServerClient();

  try {
    const presenter = await getPerson(presenterId);
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
                  <Link
                    href={`/presentations/${p.presentation_id}`}
                    className='link ml-2 text-lg'
                    key={p.presentation_id}
                  >
                    {p.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      }
    );

    return (
      <div className='prose my-4 max-w-none'>
        <PersonDisplay {...presenter} stripContainer />
        {presentationElements}
      </div>
    );
  } catch (e) {
    notFound();
  }
};

export default PresentersPage;

import {
  Presentation,
  PresentationDisplay
} from '@/Components/Layout/PresentationDisplay';
import {
  getPresentationIds,
  getPublicPresentation,
  speakerIdsToSpeakers
} from '@/lib/databaseFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { calculateSchedule, myLog } from '@/lib/utils';
import type { Metadata, NextPage } from 'next';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';

type PageProps = {
  params: {
    id: string;
  };
};

export const revalidate = 600;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return getPresentationIds();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = props.params;
  try {
    const supabase = createAnonServerClient();
    const title = (await getPublicPresentation(id, supabase)).title;
    return { title };
  } catch (error) {
    return {};
  }
}

const PresentationsForYearPage: NextPage<PageProps> = async ({ params }) => {
  const pId = params.id;
  if (typeof pId !== 'string') {
    return null;
  }

  const supabase = createAnonServerClient();

  type PresentationReturn =
    | {
        redirect: {
          destination: string;
        };
      }
    | (Presentation & { redirect?: undefined });
  const presentation: PresentationReturn = await getPublicPresentation(
    pId,
    supabase
  ).then(
    async (data) => {
      const presenters = await speakerIdsToSpeakers(
        data.all_presenters,
        supabase
      );

      const type = data.presentation_type;
      if (type === 'panel') {
        // TODO - in a future year, fix this rather than being hardcoded
        switch (data.title) {
          case 'How to make Open-Source more worthwhile?':
            return {
              redirect: {
                destination: '/panels/open-source'
              }
            };
          case 'LabVIEW and Python - A Discussion':
            return {
              redirect: {
                destination: '/panels/labview-and-python'
              }
            };
        }
      }
      const schedule = calculateSchedule(type, data.scheduled_for);

      return {
        title: data.title,
        abstract: data.abstract,
        speakers: presenters,
        speakerNames: data.all_presenters_names,
        ...schedule
      };
    },
    async (err) => {
      // Not returned by getPublicPresentations.
      const supabaseLoggedIn = createServerComponentClient();
      const { data, error } = await supabaseLoggedIn
        .from('my_submissions')
        .select('*')
        .eq('presentation_id', pId)
        .maybeSingle();
      if (error || data === null) {
        myLog({ err, error });
        notFound();
      } else {
        // Consider if this can be non-null?
        const scheduledFor = null;
        const allPresenterNames = data.all_firstnames.map((fName, idx) => {
          return `${fName} ${data.all_lastnames[idx]}`;
        });
        return {
          title: data.title,
          abstract: data.abstract,
          speakers: await speakerIdsToSpeakers(
            data.all_presenters_ids,
            supabaseLoggedIn
          ),
          speakerNames: allPresenterNames,
          ...calculateSchedule(data.presentation_type, scheduledFor),
          isPrivate: true
        };
      }
    }
  );

  if (typeof presentation.redirect != 'undefined') {
    redirect(presentation.redirect.destination);
  } else {
    return (
      <PresentationDisplay
        presentationId={pId}
        presentation={presentation}
        withFavouritesButton={false}
      />
    );
  }
};

export default PresentationsForYearPage;

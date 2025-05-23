import {
  Presentation,
  PresentationDisplay
} from '@/Components/Layout/PresentationDisplay';
import {
  getPresentationIds,
  getPublicPresentation,
  getVideoLink
} from '@/lib/databaseFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { createServerClient } from '@/lib/supabaseServer';
import { calculateSchedule, myLog } from '@/lib/utils';
import type { Metadata, NextPage } from 'next';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getPanelLink } from '@/app/panels/panelLinks';
import { getPeople } from '@/lib/supabase/public';
import { getPeople_Authed } from '@/lib/supabase/authorized';
import type { NextParams, satisfy } from '@/lib/NextTypes';

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
  return getPresentationIds();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const supabase = createAnonServerClient();
    const title = (await getPublicPresentation(id, supabase)).title;
    return { title };
  } catch (error) {
    return {};
  }
}

const PresentationsForYearPage: NextPage<PageProps> = async (props) => {
  const pId = (await props.params).id;
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
      const presenters = (await getPeople(data.all_presenters)).map((p) => {
        return { ...p, pageLink: `/presenters/${p.id}` };
      });

      const type = data.presentation_type;
      if (type === 'panel') {
        return {
          redirect: {
            destination: getPanelLink(data.title)
          }
        };
      }

      // Allow masking the schedule for 2025
      const mask = data.year === '2025';
      const scheduledFor = mask ? null : data.scheduled_for;
      const schedule = calculateSchedule(type, scheduledFor);

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
      const supabaseLoggedIn = await createServerClient();
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
          speakers: await getPeople_Authed(
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
    const videoLink = await getVideoLink(pId, supabase);
    return (
      <PresentationDisplay
        presentationId={pId}
        presentation={presentation}
        withFavouritesButton={false}
        videoLink={videoLink}
      />
    );
  }
};

export default PresentationsForYearPage;

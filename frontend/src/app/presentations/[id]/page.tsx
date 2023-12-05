import {
  Presentation,
  PresentationDisplay,
  Schedule
} from '@/Components/Layout/PresentationDisplay';
import { PersonDisplayProps } from '@/Components/PersonDisplay';
import {
  getPerson,
  getPresentationIds,
  getPublicPresentation
} from '@/lib/databaseFunctions';
import { PresentationType } from '@/lib/databaseModels';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { getSessionDurationInMinutes, myLog } from '@/lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Metadata, NextPage, Route } from 'next';
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

  const getSchedule = (
    type: PresentationType,
    scheduled_for: string | null
  ): Schedule => {
    let schedule: Schedule = {
      sessionStart: null,
      sessionEnd: null
    };
    // Panels, 7x7 for 1h, 'full length' for 45m?
    const sessionDuration = getSessionDurationInMinutes(type) * 60; // duration in seconds
    if (scheduled_for !== null) {
      const startDate = new Date(scheduled_for);
      const endDate = new Date(startDate.getTime() + sessionDuration * 1000);
      schedule = {
        sessionStart: startDate.toUTCString(),
        sessionEnd: endDate.toUTCString()
      };
    }
    return schedule;
  };
  const getSpeakers = async (
    speakerIds: string[],
    client: SupabaseClient
  ): Promise<PersonDisplayProps[]> => {
    return await Promise.all(
      speakerIds.map(async (speakerId) => {
        return {
          ...(await getPerson(speakerId, client)),
          pageLink: `/presenters/${speakerId}` as Route
        };
      })
    );
  };

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
      const presenters = await getSpeakers(data.all_presenters, supabase);

      const type = data.presentation_type;
      if (type === 'panel') {
        // ToDo - in a future year, fix this rather than being hardcoded
        const isOS = data.title === 'How to make Open-Source more worthwhile?';
        const link = `/panels/${isOS ? 'open-source' : 'labview-and-python'}`;
        return {
          redirect: {
            destination: link
          }
        };
      }
      const schedule = getSchedule(type, data.scheduled_for);

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
          speakers: await getSpeakers(
            data.all_presenters_ids,
            supabaseLoggedIn
          ),
          speakerNames: allPresenterNames,
          ...getSchedule(data.presentation_type, scheduledFor),
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

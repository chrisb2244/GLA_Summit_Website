import {
  PresentationDisplay,
  Schedule
} from '@/Components/Layout/PresentationDisplay';
import { PersonDisplayProps } from '@/Components/PersonDisplay';
import {
  getPerson,
  getPresentationIds,
  getPublicPresentation
} from '@/lib/databaseFunctions';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { getSessionDurationInMinutes } from '@/lib/utils';
import type { Metadata, NextPage, ResolvingMetadata, Route } from 'next';
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

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = params;
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

  const presentation = await getPublicPresentation(pId, supabase).then(
    async (data) => {
      const speakerIds = data.all_presenters;
      const presenters: PersonDisplayProps[] = await Promise.all(
        speakerIds.map(async (speakerId) => {
          return {
            ...(await getPerson(speakerId)),
            pageLink: `/presenters/${speakerId}` as Route
          };
        })
      );

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
      // Panels, 7x7 for 1h, 'full length' for 45m?
      const sessionDuration = getSessionDurationInMinutes(type) * 60; // duration in seconds

      let schedule: Schedule = {
        sessionStart: null,
        sessionEnd: null
      };

      if (data.scheduled_for !== null) {
        const startDate = new Date(data.scheduled_for);
        const endDate = new Date(startDate.getTime() + sessionDuration * 1000);
        schedule = {
          sessionStart: startDate.toUTCString(),
          sessionEnd: endDate.toUTCString()
        };
      }

      return {
        title: data.title,
        abstract: data.abstract,
        speakers: presenters,
        speakerNames: data.all_presenters_names,
        ...schedule
      };
    },
    (error) => {
      notFound();
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

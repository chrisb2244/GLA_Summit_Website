import {
  Presentation,
  PresentationDisplay
} from '@/Components/Layout/PresentationDisplay';
import { getPresentationIds } from '@/lib/databaseFunctions';
import { createServerClient } from '@/lib/supabaseServer';
import { calculateSchedule } from '@/lib/utils';
import type { Metadata, NextPage } from 'next';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getPanelLink } from '@/app/panels/panelLinks';
import {
  getCachedPublicPresentation,
  getCachedVideoLink,
  getPeople
} from '@/lib/supabase/public';
import { getPeople_Authed } from '@/lib/supabase/authorized';
import type { NextParams, satisfy } from '@/lib/NextTypes';
import { Suspense } from 'react';

type PageProps = {
  params: satisfy<
    NextParams,
    Promise<{
      id: string;
    }>
  >;
};

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await getPresentationIds();
  return ids.length > 0 ? ids : [{ id: '__placeholder__' }];
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const title = (await getCachedPublicPresentation(id)).title;
    return { title };
  } catch {
    return {};
  }
}

const PresentationsForYearPage: NextPage<PageProps> = (props) => {
  return (
    <Suspense fallback={<p>Loading presentation...</p>}>
      <PresentationsForYearPageContent {...props} />
    </Suspense>
  );
};

const PresentationsForYearPageContent = async (props: PageProps) => {
  const pId = (await props.params).id;
  if (pId === '__placeholder__') {
    notFound();
  }
  if (typeof pId !== 'string') {
    return null;
  }

  type PresentationReturn =
    | {
        redirect: {
          destination: string;
        };
      }
    | (Presentation & { redirect?: undefined });

  let presentation: PresentationReturn;
  try {
    const data = await getCachedPublicPresentation(pId);

    const type = data.presentation_type;
    if (type === 'panel') {
      presentation = {
        redirect: {
          destination: getPanelLink(data.title)
        }
      };
    } else {
      const presenters = (await getPeople(data.all_presenters)).map((p) => {
        return { ...p, pageLink: `/presenters/${p.id}` };
      });

      // Allow masking the schedule for 2025
      const mask = false; // data.year === '2025';
      const scheduledFor = mask ? null : data.scheduled_for;
      const schedule = calculateSchedule(type, scheduledFor);

      presentation = {
        title: data.title,
        abstract: data.abstract,
        speakers: presenters,
        speakerNames: data.all_presenters_names,
        ...schedule
      };
    }
  } catch (err) {
    // Not returned by getPublicPresentations.
    const supabaseLoggedIn = await createServerClient();
    const { data, error } = await supabaseLoggedIn
      .rpc('get_my_submissions')
      .eq('presentation_id', pId)
      .select('*')
      .maybeSingle();
    if (error || data === null) {
      console.error('Presentation lookup failed', { err, error });
      notFound();
    }

    const scheduledFor = null;
    const allPresenterNames = data.all_firstnames.map((fName, idx) => {
      return `${fName} ${data.all_lastnames[idx]}`;
    });
    presentation = {
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

  if (typeof presentation.redirect != 'undefined') {
    redirect(presentation.redirect.destination);
  } else {
    const videoLink = await getCachedVideoLink(pId);
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

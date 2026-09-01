import type { Metadata } from 'next';
import { FullAgenda } from './FullAgenda';
import type { ScheduledAgendaEntry } from '@/Components/Agenda/Agenda';
import type { ContainerHint } from '@/Components/Agenda/AgendaCalculations';
import { currentDisplayYear } from '@/app/configConstants';
import { agendaExtras } from '@/app/agendaExtras';
import { createAnonServerClient } from '@/lib/supabaseClient';
import { Suspense } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/supabase/cacheTags';
import { buildOpenGraph } from '@/app/sharedMetadata';
import type { PresentationModel as AgendaEntry } from '@/lib/databaseModels';

// The root layout's title template appends "| GLA Summit".
export const metadata: Metadata = {
  title: `${currentDisplayYear} Agenda`,
  description: `The GLA Summit ${currentDisplayYear} schedule, shown in your local timezone.`,
  alternates: { canonical: '/full-agenda' },
  openGraph: buildOpenGraph({
    title: `GLA Summit ${currentDisplayYear} Agenda`,
    url: '/full-agenda'
  })
};

const getAgendaAndHints = async () => {
  'use cache';
  cacheLife('publicContent');
  cacheTag(CACHE_TAGS.agenda);

  const returnVal = (
    agenda: AgendaEntry[] | null,
    containerHints?: ContainerHint[]
  ) => {
    return {
      fullAgenda: (agenda ?? []) as ScheduledAgendaEntry[],
      containerHints
    };
  };

  const supabase = createAnonServerClient();
  const { data: agenda, error } = await supabase
    .rpc('get_all_presentations')
    .eq('year', currentDisplayYear)
    .not('scheduled_for', 'is', 'null')
    .select('*'); // required for ScheduledAgendaEntry rather than AgendaEntry

  if (error) return returnVal(null);

  const { data: containerRows, error: containerError } = await supabase
    .from('container_groups')
    .select('container_id, presentation_id');

  if (containerError) return returnVal(agenda);

  // "relevant containers" are the containers that include a presentation in the agenda (i.e. this year)
  const presentationIds = agenda.map((p) => p.presentation_id);
  const relevantContainerRows = containerRows.filter((cr) =>
    presentationIds.includes(cr.presentation_id)
  );
  const relevantContainerIds = Array.from(
    new Set(relevantContainerRows.map((cr) => cr.container_id))
  );

  const { data: containers, error: containerPresError } = await supabase
    .from('presentation_submissions')
    .select('id, title, abstract')
    .in('id', relevantContainerIds);

  if (containerPresError) return returnVal(agenda);

  const containerHints = containers.map((c): ContainerHint => {
    const presentationIdsInContainer = relevantContainerRows
      .filter((row) => row.container_id === c.id)
      .map((row) => row.presentation_id);

    return {
      title: c.title,
      abstract: c.abstract,
      container_id: c.id,
      presentation_ids: presentationIdsInContainer,
      year: currentDisplayYear
    };
  });

  return returnVal(agenda, containerHints);
};

const SvrFullAgenda = async () => {
  const agendaAndHints = await getAgendaAndHints();
  const extras = agendaExtras[currentDisplayYear];

  return (
    <>
      <div className='prose mx-auto mb-2 max-w-none'>
        <p>
          Times shown in this agenda are in your local timezone, and reflect the{' '}
          {currentDisplayYear} agenda.
        </p>
        {extras.length > 0 && (
          <p>
            Outlined entries are part of the schedule but have no separate
            session pages.
          </p>
        )}
      </div>
      <div className='mb-[5vh] px-4'>
        <Suspense fallback={<p>Loading agenda...</p>}>
          <FullAgenda
            fullAgenda={agendaAndHints.fullAgenda}
            containerHints={agendaAndHints.containerHints ?? []}
            extras={extras}
          />
        </Suspense>
      </div>
    </>
  );
};

export default SvrFullAgenda;

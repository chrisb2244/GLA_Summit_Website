import { FullAgenda } from './FullAgenda'
import type { AgendaEntry, ScheduledAgendaEntry } from '@/Components/Agenda/Agenda'
import type { ContainerHint } from '@/Components/Agenda/AgendaCalculations'
import { currentDisplayYear } from '@/lib/databaseModels'
import { createAnonServerClient } from '@/lib/supabaseClient'

export const revalidate = 300

const getAgendaAndHints = async () => {
  const returnVal = (
    agenda: AgendaEntry[] | null,
    containerHints?: ContainerHint[]
  ) => {
    return {
      fullAgenda: (agenda ?? []) as ScheduledAgendaEntry[],
      containerHints
    }
  }

  const supabase = createAnonServerClient();
  const { data: agenda, error } = await supabase
    .from('all_presentations')
    .select('*')
    .eq('year', currentDisplayYear)
    .not('scheduled_for', 'is', 'null') // required for ScheduledAgendaEntry rather than AgendaEntry

  if (error) return returnVal(null)

  const { data: containerRows, error: containerError } = await supabase
    .from('container_groups')
    .select('*')

  if (containerError) return returnVal(agenda)

  // "relevant containers" are the containers that include a presentation in the agenda (i.e. this year)
  const presentationIds = agenda.map((p) => p.presentation_id)
  const relevantContainerRows = containerRows.filter((cr) =>
    presentationIds.includes(cr.presentation_id)
  )
  const relevantContainerIds = Array.from(
    new Set(relevantContainerRows.map((cr) => cr.container_id))
  )

  const { data: containers, error: containerPresError } = await supabase
    .from('presentation_submissions')
    .select('*')
    .in('id', relevantContainerIds)

  if (containerPresError) return returnVal(agenda)

  const containerHints = containers.map((c): ContainerHint => {
    const presentationIdsInContainer = relevantContainerRows
      .filter((row) => row.container_id === c.id)
      .map((row) => row.presentation_id)

    return {
      title: c.title,
      abstract: c.abstract,
      container_id: c.id,
      presentation_ids: presentationIdsInContainer,
      year: currentDisplayYear
    }
  })

  return returnVal(agenda, containerHints)
}

const SvrFullAgenda = async () => {
  const agendaAndHints = await getAgendaAndHints()

  return (
    <>
      <div className='mb-2 px-4 prose mx-auto'>
        <p>Times shown in this agenda are in your local timezone.</p>
        <div className='max-sm:block sm:hidden'>
          <p>We recommend that you use this page on a wider screen.</p>
        </div>
      </div>
      <div className={`px-4 mb-[5vh] `}>
        <FullAgenda
          fullAgenda={agendaAndHints.fullAgenda}
          containerHints={agendaAndHints.containerHints ?? []}
        />
      </div>
    </>
  )
}

export default SvrFullAgenda

import { PresentationSummary } from '@/Components/PresentationSummary'
import type { Presentation } from '@/Components/PresentationSummary'
import type { AllPresentationsModel } from '@/lib/databaseModels'
import { supabase } from '@/lib/supabaseClient'
import type { GetStaticProps } from 'next'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'

type AllPresentationsProps = {
  presentations: Presentation[]
}

const getPresentations = async () => {
  const { data, error } = await supabase
    .from<AllPresentationsModel>('all_presentations')
    .select('*')
    .order('scheduled_for', { ascending: true })
  if (error) throw error
  return data
}

export const getStaticProps: GetStaticProps<
  AllPresentationsProps
> = async () => {
  const dbPresentations = await getPresentations()
  const presentations = dbPresentations.map(p => {
    const presentation: Presentation = {
      title: p.title,
      abstract: p.abstract,
      speakers: p.all_presenters_names,
      presentationId: p.presentation_id
    }
    return presentation
  })

  const props = {
    presentations
  }
  return { props, revalidate: 3600 }
}

const AllPresentations: React.FC<AllPresentationsProps> = (props) => {
  const renderedPresentations = props.presentations.map((p) => (
    <PresentationSummary presentation={p} key={p.title} pageLink={`/presentations/${p.presentationId}`}/>
  ))

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      {renderedPresentations}
    </StackedBoxes>
  )
}

export default AllPresentations

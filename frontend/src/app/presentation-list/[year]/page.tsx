import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import {
  Presentation,
  PresentationSummary,
  Presenter
} from '@/Components/PresentationSummary'
import { createAnonServerClient } from '@/lib/supabaseClient'
import {
  sortPresentationsByPresenterName,
  sortPresentationsBySchedule
} from '@/lib/utils'
import { Route } from 'next'

type PageProps = {
  params: {
    year: string
  }
}

export const revalidate = 600

const PresentationsForYearPage = async (props: PageProps) => {
  const {
    params: { year }
  } = props
  const supabase = createAnonServerClient()
  const { data, error } = await supabase
    .from('all_presentations')
    .select()
    .eq('year', year)
  if (error) {
    return <p>Error loading presentations</p>
  }

  const presentations = data
    .map((p) => {
      const presenters = p.all_presenters_names.map((_, idx) => {
        const presenter: Presenter = {
          firstname: p.all_presenter_firstnames[idx],
          lastname: p.all_presenter_lastnames[idx]
        }
        return presenter
      })
      const presentation: Presentation = {
        ...p, // title, abstract, year
        speakers: presenters,
        speakerNames: p.all_presenters_names,
        presentationId: p.presentation_id,
        presentationType: p.presentation_type,
        scheduledFor: p.scheduled_for
      }
      return presentation
    })
    .sort((a, b) => {
      const bySchedule = sortPresentationsBySchedule(a, b)
      const byName = sortPresentationsByPresenterName(a, b)
      return byName !== 0 ? byName : bySchedule
    })
    .map((p) => {
      return (
        <div key={p.title} className='pb-2'>
          <PresentationSummary
            presentation={p}
            pageLink={
              p.presentationType !== 'panel'
                ? `/presentations/${p.presentationId}`
                : `/panels/${
                    p.title === 'How to make Open-Source more worthwhile?'
                      ? 'open-source'
                      : 'labview-and-python'
                  }`
            }
          />
        </div>
      )
    })

  return (
    <>
      <h3 className='text-lg text-center py-1'>{year} Presentations</h3>
      <StackedBoxes>{presentations}</StackedBoxes>
    </>
  )
}

export default PresentationsForYearPage

import type {
  Presentation,
  PresentationYear,
  Presenter
} from '@/Components/PresentationSummary'
import type { GetStaticProps } from 'next'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { getPublicPresentations } from '@/lib/databaseFunctions'
import { YearGroupedPresentations } from '@/Components/Layout/YearGroupedPresentations'
import { Typography } from '@mui/material'

type AllPresentationsProps = {
  presentations: Presentation[]
}

type EntriesType = [PresentationYear, Presentation[]][]

export const getStaticProps: GetStaticProps<
  AllPresentationsProps
> = async () => {
  const dbPresentations = await getPublicPresentations()
  const presentations = dbPresentations
    .map((p) => {
      const presenters = p.all_presenters_names.map((_, idx) => {
        const presenter: Presenter = {
          firstname: p.all_presenter_firstnames[idx],
          lastname: p.all_presenter_lastnames[idx]
        }
        return presenter
      })
      const presentation: Presentation = {
        title: p.title,
        abstract: p.abstract,
        speakers: presenters,
        speakerNames: p.all_presenters_names,
        presentationId: p.presentation_id,
        year: p.year,
        scheduledFor: p.scheduled_for,
        presentationType: p.presentation_type
      }
      return presentation
    })

  const props = {
    presentations
  }
  return { props, revalidate: 3600 }
}

const AllPresentations: React.FC<AllPresentationsProps> = ({
  presentations
}) => {
  const groupedPresentationProps: {
    [key in PresentationYear]?: Presentation[]
  } = {
    '2023': presentations.filter((p) => p.year === '2023'),
    '2022': presentations.filter((p) => p.year === '2022'),
    '2021': presentations.filter((p) => p.year === '2021'),
    '2020': presentations.filter((p) => p.year === '2020')
  }

  const elems = (Object.entries(groupedPresentationProps) as EntriesType)
    .sort((a, b) => {
      return parseInt(b[0], 10) - parseInt(a[0], 10)
    })
    .filter((v) => v[1].length !== 0) // filter before map to make idx=0 the top element
    .map(([year, presentationsInYear], idx, arr) => (
      <YearGroupedPresentations
        year={year}
        presentations={presentationsInYear}
        initiallyOpen={idx === 0}
        disableAccordion={arr.length === 1}
        key={`presentationslist-${year}`}
      />
    ))

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      <Typography variant='h6' pl={1.5}>
        The list of confirmed presentations for 2022 is still growing - come back soon to see more sessions!
      </Typography>
      {elems}
    </StackedBoxes>
  )
}

export default AllPresentations

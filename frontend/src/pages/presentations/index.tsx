import type { Presentation, Presenter } from '@/Components/PresentationSummary'
import type { GetStaticProps } from 'next'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { getPublicPresentations } from '@/lib/databaseFunctions'
import { YearGroupedPresentations } from '@/Components/Layout/YearGroupedPresentations'
import { Box, Typography } from '@mui/material'
import { splitByYear } from '@/lib/presentationArrayFunctions'
import NextLink from 'next/link'

type AllPresentationsProps = {
  presentations: Presentation[]
}

export const getStaticProps: GetStaticProps<
  AllPresentationsProps
> = async () => {
  const dbPresentations = await getPublicPresentations()
  const presentations = dbPresentations.map((p) => {
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
  const presentationEntries = splitByYear(presentations)
  const elems = presentationEntries.map(
    ([year, presentationsInYear], idx, arr) => (
      <Box pb={1} key={`presentationslist-${year}`}>
        <YearGroupedPresentations
          year={year}
          presentations={presentationsInYear}
          initiallyOpen={idx === 0}
          disableAccordion={arr.length === 1}
        />
      </Box>
    )
  )

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      {/* <div className='mx-auto'>
        <a href={'https://hopin.com/events/gla-summit-2022'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            <Typography textAlign='center'>
              Go to the Hopin Event page
            </Typography>
          </Button>
        </a>
      </div> */}
      <Typography>
        Presentations below are listed by first speaker&apos;s name.
      </Typography>
      <Typography>
        For a list by schedule, see our{' '}
        <NextLink href='/full-agenda' passHref legacyBehavior>
          <a className='underline'>agenda</a>
        </NextLink>
        !
      </Typography>
      {elems}
    </StackedBoxes>
  )
}

export default AllPresentations

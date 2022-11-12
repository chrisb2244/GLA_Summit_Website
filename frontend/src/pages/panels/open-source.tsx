import type { Presentation, Presenter } from '@/Components/PresentationSummary'
import type { GetStaticProps } from 'next'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { getPublicPresentations } from '@/lib/databaseFunctions'
import { YearGroupedPresentations } from '@/Components/Layout/YearGroupedPresentations'
import { Box, Typography, Button } from '@mui/material'
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
          presentations={presentationsInYear.slice(0, 3)}
          initiallyOpen={idx === 0}
          disableAccordion={arr.length === 1}
        />
      </Box>
    )
  )

  /*
    Moderator: Mike Radziwon
    enrique.noe@pantherlab.com.mx 
    joerg@hampel-soft.com
    q@qsi.dev
    francois.normandin@desim.ca

    One of the things that keeps the software community alive is the share/reuse of code in Open-Source manner. 
    However, it seems that LabVIEW community struggles a lot with this concept, so we have thought about 
    raising this topic as a panel discussion during the GLA Summit 2022. The benefits of open source were 
    discussed thoroughly many times in the community; therefore, I would like to propose a different take on it:

    Why does it not work as well for LabVIEW, as for textual languages? 
    Where are the main barriers? 
    What can we do to overcome them?
  */
  const panelists = (
    <div className='prose'>
      <ul>
        <li>Quentin Alldredge</li>
        <li>Enrique Noe Arias</li>
        <li>Jörg Hampel</li>
        <li>Francois Normandin</li>
        <li>With Michał Radziwon moderating discussion</li>
      </ul>
    </div>
  )

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      <Typography variant='h3' textAlign={'center'}>
        How to make Open-Source more worthwhile?
      </Typography>
      <div className='prose max-w-screen-lg mx-auto'>
        <p>
          One of the things that keeps the software community alive is the
          sharing and reuse of code. However, the LabVIEW community has
          relatively few examples of open-source projects with multiple
          contributors - instead featuring projects built in many cases by small
          teams or individuals.
        </p>
        <p>
          The benefits of open source have been widely promoted within the
          LabVIEW community - including in presentations at this summit such as{' '}
          <a href='/presentations/85079b3c-e4f3-4ebe-b676-c9af4d97ff3b'>
            G Idea Exchange: Empowering Your Open-Source LabVIEW Ideas
          </a>{' '}
          and{' '}
          <a href='/presentations/4dfe14f6-6c89-427d-a259-63f976392a75'>
            A real-life example of contribution to a LabVIEW open-source project
          </a>
          .
        </p>
        <p>For this panel, we therefore want to discuss a different aspect:</p>
        <ul>
          <li>
            Why does this not work as well for LabVIEW as for text-based
            languages?
          </li>
          <li>Where are the main barriers?</li>
          <li>What can we do to overcome them?</li>
        </ul>
        <p>
          To find out more, come and hear our panelists discuss these topics!
        </p>
      </div>

      {panelists}
      <div className='mx-auto'>
        <a href={'https://hopin.com/events/gla-summit-2022'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            <Typography textAlign='center'>
              Go to the Hopin Event page
            </Typography>
          </Button>
        </a>
      </div>
      <div className='mx-auto'>
        <a href={'/full-agenda'}>
          <Button fullWidth variant='contained' className='bg-primaryc'>
            <Typography textAlign='center'>Go to the agenda</Typography>
          </Button>
        </a>
      </div>
    </StackedBoxes>
  )
}

export default AllPresentations

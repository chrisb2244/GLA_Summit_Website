import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { getPerson, getPublicProfiles } from '@/lib/databaseFunctions'
import type { GetStaticProps } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { PresentationYear } from '@/Components/PresentationSummary'
import { YearGroupedPresenters } from '@/Components/Layout/YearGroupedPresenters'
import { Box } from '@mui/material'

export const getStaticProps: GetStaticProps = async () => {
  const getIdsForYear = async (year: PresentationYear) => {
    const { data, error } = await supabase
      .from('accepted_presentations')
      .select('presentation_submissions(presentation_presenters(presenter_id))')
      .eq('year', year)
    if (error) {
      return []
    }

    const personIds = data.reduce((prev, current) => {
      if (current.presentation_submissions === null) {
        return prev
      }
      if (Array.isArray(current.presentation_submissions)) {
        return prev
      } else {
        const presenters =
          current.presentation_submissions.presentation_presenters
        if (presenters === null) {
          return prev
        }
        if (Array.isArray(presenters)) {
          return presenters.length > 0 ? prev.concat(presenters) : prev
        } else {
          return prev.concat(presenters)
        }
      }
    }, new Array<{ presenter_id: string }>())

    const uniquePersonIds = Array.from(
      new Set(personIds.map((p) => p.presenter_id))
    )
    return uniquePersonIds
  }

  const ids22 = getIdsForYear('2022')
  const ids21 = getIdsForYear('2021')

  const genProps = async (ids: string[]) => {
    const profiles = await Promise.all(
      ids.map(async (p) => {
        return {
          id: p,
          person: await getPerson(p)
        }
      })
    )
    return profiles
  }

  const profiles22 = await ids22.then(genProps)
  const profiles21 = await ids21.then(genProps)

  return {
    props: {
      peopleProps22: profiles22,
      peopleProps21: profiles21
    }
  }
}

const AllProfiles: React.FC<{
  peopleProps22: { id: string; person: PersonDisplayProps }[]
  peopleProps21: { id: string; person: PersonDisplayProps }[]
}> = (props) => {
  const renderProfiles = (
    yearSet: { id: string; person: PersonDisplayProps }[]
  ) => {
    return yearSet
      .sort((a, b) => {
        return -1 * ('' + b.person.lastName).localeCompare(a.person.lastName)
      })
      .map(({ id, person }) => {
        return (
          <PersonDisplay
            key={id}
            {...person}
            useDefaultIconImage
            pageLink={`/presenters/${id}`}
          />
        )
      })
  }

  const renderedProfiles22 = renderProfiles(props.peopleProps22)
  const renderedProfiles21 = renderProfiles(props.peopleProps21)
  // const renderedProfiles = props.peopleProps.map((i) => {
  //   return <div>{JSON.stringify(i)}</div>
  // })

  return (
    <StackedBoxes>
      <Box>
        <YearGroupedPresenters elements={renderedProfiles22} initiallyOpen year={'2022'} disableAccordion={false} />
      </Box>
      <Box>
        <YearGroupedPresenters elements={renderedProfiles21} year={'2021'} disableAccordion={false} />
      </Box>
      {/* <div>{props.peopleProps.length}</div> */}
    </StackedBoxes>
  )
}

export default AllProfiles

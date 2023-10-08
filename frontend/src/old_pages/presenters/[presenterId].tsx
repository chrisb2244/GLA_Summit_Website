import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { Box, Paper, Typography } from '@mui/material'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { Link } from '@/lib/link'
import {
  getPerson,
  getPublicPresentationsForPresenter,
  getPublicProfileIds
} from '@/lib/databaseFunctions'
import { splitByYear } from '@/lib/presentationArrayFunctions'
import { myLog } from '@/lib/utils'
import { PresentationYear } from '@/Components/PresentationSummary'

type ProfileProps = {
  presenter: PersonDisplayProps
  presentations: Array<{ id: string; title: string; year: PresentationYear }>
}

// Get the list of presenterIds for which to generate static pages
export const getStaticPaths: GetStaticPaths = async () => {
  const pathArray = await getPublicProfileIds().then((ids) =>
    ids.map((id) => '/presenters/' + id)
  )

  return {
    paths: pathArray,
    fallback: 'blocking'
  }
}

// Get the props required to generate a page, given the path (presenterId)
export const getStaticProps: GetStaticProps<ProfileProps> = async ({
  params
}) => {
  const presenterId = params?.presenterId
  if (typeof presenterId !== 'string') {
    return {
      notFound: true
    }
  }

  const presenterInfo = await getPerson(presenterId)

  const presentations = await getPublicPresentationsForPresenter(presenterId)
    .then((presentationsData) => {
      return presentationsData.map((d) => {
        return { id: d.presentation_id, title: d.title, year: d.year }
      })
    })
    .catch((error) => {
      myLog(error)
      return []
    })

  return {
    props: {
      presenter: presenterInfo,
      presentations
    },
    revalidate: 3600
  }
}

// Render (and hydrate if required) the page
const PresenterPage: NextPage<ProfileProps> = ({
  presenter,
  presentations
}) => {
  const presentationsByYear = splitByYear(presentations)
  const presentationElems = presentationsByYear.map(
    ([year, presentationsInYear]) => {
      return (
        <Box
          key={`presentations-${year}`}
          pb={1}
          width={{ xs: '100%', md: '95%' }}
          marginX='auto'
        >
          <Typography variant='h5'>{year}</Typography>
          {presentationsInYear.map((p) => (
            <Box key={p.id}>
              <Link href={`/presentations/${p.id}`} variant='h5' gutterBottom>
                {p.title}
              </Link>
            </Box>
          ))}
        </Box>
      )
    }
  )

  return (
    <Paper>
      <Box marginTop={2} paddingTop={2}>
        <StackedBoxes>
          <PersonDisplay {...presenter} stripContainer />
          {presentationElems}
        </StackedBoxes>
      </Box>
    </Paper>
  )
}

export default PresenterPage

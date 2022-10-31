import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import { Box, Paper } from '@mui/material'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { Link } from '@/lib/link'
import { getPerson, getPublicPresentationsForPresenter, getPublicProfileIds } from '@/lib/databaseFunctions'

type ProfileProps = {
  presenter: PersonDisplayProps
  presentations: Array<{ id: string; title: string }>
}

// Get the list of presenterIds for which to generate static pages
export const getStaticPaths: GetStaticPaths = async () => {
  const pathArray = await getPublicProfileIds()
    .then(ids => ids.map(id => '/presenters/' + id))

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
        return { id: d.presentation_id, title: d.title }
      })
    })
    .catch((error) => {
      return [{ id: 'oops', title: JSON.stringify(error)}]
    })

  return {
    props: {
      presenter: presenterInfo,
      presentations
    }
  }
}

// Render (and hydrate if required) the page
const PresenterPage: NextPage<ProfileProps> = ({
  presenter,
  presentations
}) => {
  return (
    <Paper>
      <Box marginTop={2} paddingTop={2}>
        <StackedBoxes>
          <PersonDisplay {...presenter} stripContainer />
          {presentations.map((presentation) => {
            return (
              <Box
                width={{ xs: '100%', md: '95%' }}
                marginX='auto'
                key={presentation.id}
              >
                <Link
                  href={`/presentations/${presentation.id}`}
                  variant='h5'
                  gutterBottom
                >
                  {presentation.title}
                </Link>
              </Box>
            )
          })}
        </StackedBoxes>
      </Box>
    </Paper>
  )
}

export default PresenterPage

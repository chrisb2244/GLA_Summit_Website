import { supabase } from '@/lib/supabaseClient'
import type { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import type { AllPresentationsModel } from '@/lib/databaseModels'
import { Box, Paper } from '@mui/material'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { Link } from '@/lib/link'
import { getPerson } from '@/lib/databaseFunctions'

type ProfileProps = {
  presenter: PersonDisplayProps
  presentations: Array<{ id: string; title: string }>
}

// Get the list of presenterIds for which to generate static pages
export const getStaticPaths: GetStaticPaths = async () => {
  const { data, error } = await supabase.from('public_profiles').select('id')
  if (error) throw error
  const presenterIdArray = data.map((p) => {
    return '/presenters/' + p.id
  })

  return {
    paths: presenterIdArray,
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

  const { data: presentationData, error: presentationsError } = await supabase
    .from<AllPresentationsModel>('all_presentations')
    .select('presentation_id,title')
    .contains('all_presenters', [presenterId])

  const debugEntry = { id: 'oops', title: JSON.stringify(presentationsError) }

  return {
    props: {
      presenter: presenterInfo,
      presentations: presentationsError
        ? [debugEntry]
        : presentationData.map((d) => {
            return { id: d.presentation_id, title: d.title }
          })
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

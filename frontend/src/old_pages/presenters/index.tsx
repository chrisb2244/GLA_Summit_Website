import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { PersonDisplay, PersonDisplayProps } from '@/Components/PersonDisplay'
import { getPerson, getPublicProfiles } from '@/lib/databaseFunctions'
import type { GetStaticProps } from 'next'

export const getStaticProps: GetStaticProps = async () => {
  const profiles = await Promise.all(
    await getPublicProfiles().then((profiles) => {
      return profiles.map(async (p) => {
        return {
          id: p.id,
          person: await getPerson(p.id)
        }
      })
    })
  )

  return {
    props: {
      peopleProps: profiles
    }
  }
}

const AllProfiles: React.FC<React.PropsWithChildren<{
  peopleProps: { id: string; person: PersonDisplayProps }[]
}>> = (props) => {
  const renderedProfiles = props.peopleProps.map(({ id, person }) => {
    return (
      <PersonDisplay
        key={id}
        {...person}
        useDefaultIconImage
        pageLink={`/presenters/${id}`}
      />
    )
  })

  return <StackedBoxes>{renderedProfiles}</StackedBoxes>
}

export default AllProfiles

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
  const presentations = await getPresentations()

  const props = {
    presentations
  }
  return { props, revalidate: 3600 }
}

const AllPresentations: React.FC<AllPresentationsProps> = (props) => {
  const renderedPresentations = props.presentations.map((p) => (
    <PresentationSummary presentation={p} key={p.title} />
  ))

  // The Box here prevents going to the very edge on smaller screens
  return (
    <StackedBoxes>
      {renderedPresentations}
    </StackedBoxes>
  )
}

export default AllPresentations

// const MyProfile = (): JSX.Element => {

//     return (
//       <Paper>
//         <Stack direction='row' justifyContent='space-around'>
//           <Box width='60%' padding={2} alignItems='center'>
//             <Typography variant='h4' className='gla-organizer-name'>
//               {props.firstName} {props.lastName}
//             </Typography>
//             <Typography
//               className='gla-organizer-description'
//               component='div'
//               variant='body1'
//               align='justify'
//               style={{ whiteSpace: 'pre-wrap' }}
//             >
//               {props.description}
//             </Typography>
//           </Box>
//           <Box width='30%' position='relative' margin={2}>
//             {image}
//           </Box>
//         </Stack>
//       </Paper>
//     )
//   }

//   const renderedProfiles = allProfiles.map((user) => {
//     return (
//       <RenderedProfile
//         key={user.id}
//         firstName={user.firstname}
//         lastName={user.lastname}
//         description={user.bio}
//         imagePath={user.avatar_url}
//       />
//     )
//   })

//   return (
//     <Stack spacing={2} marginBottom={2} maxWidth='lg'>
//       {renderedProfiles}
//     </Stack>
//   )
// }

// export default MyProfile

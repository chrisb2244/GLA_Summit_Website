import { ProfileModel } from '@/lib/sessionContext'
import { supabase } from '@/lib/supabaseClient'
import { Box, Paper, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const MyProfile = (): JSX.Element => {
  const [allProfiles, setAllProfiles] = useState<Array<ProfileModel>>([])
  const getProfiles = async () => {
    const { data, error } = await supabase
      .from<ProfileModel>('profiles')
      .select('*')
      .order('lastname', { ascending: true })
    if (error) throw error
    if (data) setAllProfiles(data)
  }

  useEffect(() => {
    getProfiles()
  }, [])

  const RenderedProfile: React.FC<{
    firstName: string
    lastName: string
    description: string | null
    imagePath: string | null
  }> = (props) => {
    let image
    if (props.imagePath) {
      const { error, publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(props.imagePath)
      if (error == null) {
        if (publicURL) {
          image = (
            <Image
              layout='fill'
              src={publicURL}
              objectFit='contain'
              alt={`profile picture for ${props.firstName} ${props.lastName}`}
            />
          )
        }
      } else {
        console.log(error)
      }
    }

    // let processedDescription = props.description
    // if (props.description?.match(/\\r\\n/)) {
    //   processedDescription = props.description.replaceAll(/\\r\\n/g, '\r\n')
    //   console.log(`${props.firstName} ${props.lastName}`)
    // }

    return (
      <Paper>
        <Stack direction='row' justifyContent='space-around'>
          <Box width='60%' padding={2} alignItems='center'>
            <Typography variant='h4' className='gla-organizer-name'>
              {props.firstName} {props.lastName}
            </Typography>
            <Typography
              className='gla-organizer-description'
              component='div'
              variant='body1'
              align='justify'
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {props.description}
            </Typography>
          </Box>
          <Box width='30%' position='relative' margin={2}>
            {image}
          </Box>
        </Stack>
      </Paper>
    )
  }

  const renderedProfiles = allProfiles.map((user) => {
    return (
      <RenderedProfile
        key={user.id}
        firstName={user.firstname}
        lastName={user.lastname}
        description={user.bio}
        imagePath={user.avatar_url}
      />
    )
  })

  return (
    <Stack spacing={2} marginBottom={2} maxWidth='lg'>
      {renderedProfiles}
    </Stack>
  )
}

export default MyProfile

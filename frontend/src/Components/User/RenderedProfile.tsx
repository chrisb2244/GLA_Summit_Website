import Image from 'next/image'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { supabase } from '@/lib/supabaseClient'

type RenderedProfileProps = {
  firstName: string
  lastName: string
  description: string | null
  imagePath: string | null
}

export const RenderedProfile: React.FC<RenderedProfileProps> = (props) => {
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

import { ReactElement } from 'react'
import { Typography, Paper, Box, Stack } from '@mui/material'
import Image, { StaticImageData } from 'next/image'

export interface OrganizerProps {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: StaticImageData
  imageSide?: 'left' | 'right'
  imagePosition?: string
}

export const Organizer: React.FC<OrganizerProps> = (props) => {
  const direction =
    typeof props.imageSide !== 'undefined'
      ? props.imageSide === 'right'
        ? 'row'
        : 'row-reverse'
      : 'row'
  const position = props.imagePosition
    ? { objectPosition: props.imagePosition }
    : {}

  const imageElem =
    typeof props.image !== 'undefined' ? (
      <Image
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        objectFit='cover'
        {...position}
      />
    ) : null

  return (
    <Paper>
      <Stack
        direction={{ xs: 'column', md: direction }}
        justifyContent='space-around'
      >
        <Box width={{ xs: '100%', md: '60%' }} padding={2} alignItems='center'>
          <Typography variant='h4' className='gla-organizer-name'>
            {props.firstName} {props.lastName}
          </Typography>
          <Typography
            className='gla-organizer-description'
            component='div'
            variant='body1'
            align='justify'
          >
            {props.description}
          </Typography>
        </Box>
        <Box
          width={{ xs: '100%', md: '30%' }}
          padding={2}
          display='flex'
          flexDirection='row'
          justifyContent='center'
        >
          {imageElem}
        </Box>
      </Stack>
    </Paper>
  )
}

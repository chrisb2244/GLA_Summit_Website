import { ReactElement } from 'react'
import { Typography, Paper, Box, Stack } from '@mui/material'
import Image, { StaticImageData } from 'next/image'

export interface OrganizerProps {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: StaticImageData
  imageSide?: 'left' | 'right'
}

export const Organizer: React.FC<OrganizerProps> = (props) => {
  const direction =
    typeof props.imageSide !== 'undefined'
      ? props.imageSide === 'right'
        ? 'row'
        : 'row-reverse'
      : 'row'

  const imageElem =
    typeof props.image !== 'undefined' ? (
      <Image
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
      />
    ) : null

  return (
    <Paper>
      <Stack direction={direction} justifyContent='space-around'>
        <Box width='60%' padding={2} alignItems='center'>
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
        <Box width='30%' padding={2}>
          {imageElem}
        </Box>
      </Stack>
    </Paper>
  )
}

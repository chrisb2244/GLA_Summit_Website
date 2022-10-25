import { Fragment, ReactElement } from 'react'
import { Typography, Paper, Box, Stack } from '@mui/material'
import Image, { StaticImageData } from 'next/image'
import { Person as PersonIcon } from '@mui/icons-material'
import { Link } from '@/lib/link'
import type { LinkProps } from '@/lib/link'

export interface PersonDisplayProps {
  firstName: string
  lastName: string
  description: string | ReactElement
  image?: StaticImageData | string | null
  imageSide?: 'left' | 'right'
  useDefaultIconImage?: boolean
  stripContainer?: boolean
  pageLink?: string
}

export const PersonDisplay: React.FC<PersonDisplayProps> = ({
  pageLink,
  ...props
}) => {
  const direction =
    typeof props.imageSide !== 'undefined'
      ? props.imageSide === 'right'
        ? 'row'
        : 'row-reverse'
      : 'row'

  let isDefaultImage = false
  let imageElem = null
  if (
    typeof props.image !== 'undefined' &&
    props.image !== null &&
    typeof props.image !== 'string'
  ) {
    // Static image file
    imageElem = (
      <Image
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          height: 'auto',
          width: '100%',
          objectFit: 'contain'
        }}
      />
    )
  } else if (typeof props.image !== 'undefined' && props.image !== null) {
    // Image by URL
    imageElem = (
      <Image
        fill
        src={props.image}
        alt={`Image of ${props.firstName} ${props.lastName}`}
        style={{ objectFit: 'contain' }}
      />
    )
  } else {
    // No image
    if (props.useDefaultIconImage) {
      isDefaultImage = true
      imageElem = (
        <PersonIcon
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            height: 'auto',
            width: '100%'
          }}
        />
      )
    }
  }

  let descriptionElem: JSX.Element | null = null
  if (typeof props.description === 'string') {
    descriptionElem = (
      <>
        {props.description.split('\r\n').map((para, idx) => {
          return <p key={`p${idx}`}>{para}</p>
        })}
      </>
    )
  } else {
    descriptionElem = props.description
  }

  const OuterElem = props.stripContainer ? Fragment : Paper

  const TitleComponent: React.FC<LinkProps> = ({ children, ...props }) => {
    if (typeof pageLink !== 'undefined') {
      return (
        <Link href={pageLink} {...props}>
          {children}
        </Link>
      )
    } else {
      return <Typography {...props}>{children}</Typography>
    }
  }

  return (
    <OuterElem>
      <Stack
        direction={{ xs: 'column', md: direction }}
        justifyContent='space-around'
        alignContent='center'
      >
        <Box
          width={{ xs: '100%', md: '60%' }}
          padding={props.stripContainer ? 0 : 2}
          alignItems='center'
        >
          <TitleComponent variant='h4'>
            {props.firstName} {props.lastName}
          </TitleComponent>
          <Typography
            component='div'
            variant='body1'
            align='justify'
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {descriptionElem}
          </Typography>
        </Box>
        <Box
          width={{ xs: '100%', md: '30%' }}
          minHeight='200px'
          padding={props.stripContainer ? 0 : 2}
          marginY={2}
          display={{ xs: isDefaultImage ? 'none' : 'flex', md: 'flex' }}
          flexDirection='row'
          justifyContent='center'
          position='relative'
        >
          {imageElem}
        </Box>
      </Stack>
    </OuterElem>
  )
}

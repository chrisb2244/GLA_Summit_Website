import FB_Attendee from '@/media/banners/attendee-fb-2022-01.jpg'
import IN_Attendee from '@/media/banners/attendee-in-2022-01.jpg'
import LI_Attendee from '@/media/banners/attendee-li-2022-01.jpg'
import TW_Attendee from '@/media/banners/attendee-tw-2022-01.jpg'
import FB_Speaker from '@/media/banners/speaker-fb-2022-01.jpg'
import IN_Speaker from '@/media/banners/speaker-in-2021-01.jpg'
import LI_Speaker from '@/media/banners/speaker-li-2022-01.jpg'
import TW_Speaker from '@/media/banners/speaker-tw-2022-01.jpg'
import SignatureImage from '@/media/banners/GLASummit2022WikiBanner.png'
import JKI_Logo from '@/media/JKI-Logo.webp'
import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { NextPage } from 'next'
import NextImage from 'next/image'
import { Box, Typography } from '@mui/material'
import type { TypographyProps, BoxProps } from '@mui/material'
import { CopyableTextBox } from '@/Components/CopyableTextBox'

const MediaPage: NextPage = () => {
  const hostname =
    typeof window !== 'undefined'
      ? window.location.protocol + '//' + window.location.host
      : ''

  const images = [
    { label: 'Facebook', attendeeImg: FB_Attendee, speakerImg: FB_Speaker },
    { label: 'Instagram', attendeeImg: IN_Attendee, speakerImg: IN_Speaker },
    { label: 'LinkedIn', attendeeImg: LI_Attendee, speakerImg: LI_Speaker },
    { label: 'Twitter', attendeeImg: TW_Attendee, speakerImg: TW_Speaker }
  ]

  const bannerImagesAttendee = images
    .map((elem) => {
      const img = elem.attendeeImg
      const url = hostname + img.src
      return (
        <a key={`bannerimage-link-attendee-${elem.label}`} href={url}>
          <Typography>
            {`Attendee - ${elem.label}: (${img.width}x${img.height} px)`}
          </Typography>
        </a>
      )
    })
    .concat(<NextImage key='bannerimage-attendee' src={TW_Attendee} />)

  const bannerImagesSpeaker = images
    .map((elem) => {
      const img = elem.speakerImg
      const url = hostname + img.src
      return (
        <a key={`bannerimage-link-speaker-${elem.label}`} href={url}>
          <Typography>
            {`Speaker - ${elem.label}: (${img.width}x${img.height} px)`}
          </Typography>
        </a>
      )
    })
    .concat(<NextImage key='bannerimage-speaker' src={TW_Speaker} />)

  const Subtitle: React.FC<TypographyProps> = ({ children, ...other }) => (
    <Typography variant='h4' {...other}>
      {children}
    </Typography>
  )
  const Paragraph: React.FC<TypographyProps> = ({ children, ...other }) => (
    <Typography variant='body1' {...other}>
      {children}
    </Typography>
  )
  const SidewaysBox: React.FC<BoxProps> = ({ children, ...other }) => {
    return (
      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems='center'
        {...other}
      >
        {children}
      </Box>
    )
  }

  return (
    <StackedBoxes>
      <SidewaysBox paddingX={4}>
        <NextImage src={JKI_Logo} />
        <Typography marginX={2}>
          The GLA Summit Organizers would like to thank JKI for providing us
          with the images and banners available below, along with other graphics
          support.
        </Typography>
      </SidewaysBox>
      <Paragraph>
        Please feel free to use the images on this page on your social media or
        website (including your NI forum signature). Links to the images can be
        found in the &lsquo;href&rsquo; attributes of the HTML samples, or by
        right-clicking and choosing an option like &ldquo;Copy image
        address&rdquo;.
      </Paragraph>
      <Paragraph>
        To access your signature on the NI Community pages, go to your community
        account &ldquo;My Profile&rdquo; settings and then Personal &gt;
        Personal Information.
      </Paragraph>
      <Paragraph>
        Examples of HTML that could be copied into the signature line are below:
      </Paragraph>

      <SidewaysBox>
        <NextImage src={SignatureImage} />
        <CopyableTextBox
          fill='lightgrey'
          variant='body2'
          fontFamily='monospace'
          sx={{wordBreak: 'break-all'}}
        >
          &lt;a href=&quot;https://glasummit.org&quot;&gt; &lt;img src=&quot;
          {hostname + SignatureImage.src}&quot; height=&quot;100&quot;
          width=&quot;300&quot; alt=&quot;I&apos;m attending the GLA
          Summit!&quot;&gt; &lt;/a&gt;
        </CopyableTextBox>
      </SidewaysBox>

      <Subtitle>Attendees</Subtitle>
      {bannerImagesAttendee}

      <Subtitle>Speakers</Subtitle>
      {bannerImagesSpeaker}
    </StackedBoxes>
  )
}

export default MediaPage

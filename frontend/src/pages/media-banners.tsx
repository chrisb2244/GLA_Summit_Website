import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Box, List, ListItem, Typography } from '@mui/material'
import NextImage from 'next/image'
import type { NextPage } from 'next'

import JKI_Logo from '@/media/banners/JKI_logo.png'
import attendee_fb from '@/media/banners/attendee-fb-2022-01.jpg'
import attendee_in from '@/media/banners/attendee-in-2022-01.jpg'
import attendee_li from '@/media/banners/attendee-li-2022-01.jpg'
import attendee_tw from '@/media/banners/attendee-tw-2022-01.jpg'
import speaker_fb from '@/media/banners/speaker-fb-2022-01.jpg'
import speaker_in from '@/media/banners/speaker-in-2022-01.jpg'
import speaker_li from '@/media/banners/speaker-li-2022-01.jpg'
import speaker_tw from '@/media/banners/speaker-tw-2022-01.jpg'

const MediaPage: NextPage = () => {
  return (
    <StackedBoxes>
      <Typography variant='h3'>Media</Typography>
      <Box flexDirection={{xs: 'column-reverse', sm: 'row'}} display='flex' alignItems='center' justifyContent='space-evenly'>
        <NextImage src={JKI_Logo} />
        <Typography p={1} variant='h6' maxWidth={{xs: '100%', sm: '60%'}}>
          The GLA Summit thanks JKI for providing us with the images and banners
          available below, along with other graphics support such as our logo.
        </Typography>
      </Box>
      <Typography>
        Please feel free to use the images on this page on your social media or
        website (including your NI forum signature). Links to the images can be
        found in the &lsquo;href&rsquo; attributes of the HTML samples.
        <br />
        To access your signature on the NI Community pages, go to your community
        account “My Profile” settings and then
        Personal&nbsp;&gt;&nbsp;Personal&nbsp;Information.
        <br />
        Examples of HTML that could be copied into the signature line are below:
        <br />
        The images are available in a range of resolutions to suit different
        platforms.
      </Typography>
      <Box>
        <Typography variant='h4'>Attendees</Typography>
        <NextImage src={attendee_fb} />
        <List>
          <ListItem component='a' href='/media/banners/attendee-in-2022-01.jpg'>
            2250x4000 (LinkedIn, portrait)
          </ListItem>
        </List>
      </Box>
      <Box>
        <Typography variant='h4'>Speakers</Typography>
        <Typography>Coming soon!</Typography>
        {/* <NextImage src={speaker_fb} /> */}
      </Box>
    </StackedBoxes>
  )
}

export default MediaPage

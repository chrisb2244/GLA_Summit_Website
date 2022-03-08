import { Box } from '@mui/material'
import { Twitter, Facebook, YouTube, Instagram } from '@mui/icons-material'

export const SocialMediaIcons: React.FC = (props) => {
  return (
    <Box
      role='grid'
      aria-label='Social Media Links'
      sx={{ '& a': { px: 0.4 }, '.MuiSvgIcon-root': { color: (t) => t.palette.primary.contrastText, fontSize: '18px' } }}
    >
      <a aria-label='Twitter link' href='https://twitter.com/glasummit'>
        <Twitter />
      </a>
      <a aria-label='FaceBook link' href='https://www.facebook.com/GLASummit/'>
        <Facebook />
      </a>
      <a aria-label='YouTube link' href='https://www.youtube.com/channel/UCtQvJ5rMGYoq8n7ExvITVNA'>
        <YouTube />
      </a>
      <a aria-label='Instagram link' href='https://www.instagram.com/glasummit/'>
        <Instagram />
      </a>
    </Box>
  )
}

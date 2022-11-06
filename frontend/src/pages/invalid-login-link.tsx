import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Box, Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone'
import type { NextPage } from 'next'

const InvalidLoginLinkPage: NextPage = () => {
  const T = (props: { children: React.ReactNode }) => (
    <Typography textAlign='center'>{props.children}</Typography>
  )

  return (
    <StackedBoxes>
      <Box>
        <T>
          <ErrorIcon fontSize='large' sx={{ mt: 5 }} />
        </T>
        <T>Unfortunately, your login link has expired.</T>
        <T>Please use the login button again to send a new sign-in email.</T>
      </Box>
      <Box>
        <T>
          If you have been directed to this page only a short time after
          attempting to sign in, and you believe that your login token should
          not have expired, then it is possible that your email provider has
          proactively scanned the links in your email (for example, for virus or
          spam prevention purposes).
        </T>
      </Box>
      <Box>
        <T>
          Since these links are single-use, this would have invalidated the link
          effectively before you received it.
        </T>
        <T>
          We are working on an alternative sign-in mechanism to prevent this
          issue, but for now, we suggest that using a different email address
          (with a different provider) might avoid this issue.
        </T>
      </Box>
    </StackedBoxes>
  )
}

export default InvalidLoginLinkPage

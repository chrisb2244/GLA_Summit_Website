import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone'
import type { NextPage } from 'next'

const AccessDeniedPage: NextPage = () => {
  const T: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
    <Typography textAlign='center'>{children}</Typography>
  )

  return (
    <StackedBoxes>
      <T>
        <ErrorIcon fontSize='large' sx={{ mt: 5 }} />
      </T>
      <T>You do not have access to this page.</T>
      <T>
        If you believe you should have access, please check that you are signed
        in, and with the correct account.
      </T>
      <T>If you still cannot access this page, contact web@glasummit.org</T>
    </StackedBoxes>
  )
}

export default AccessDeniedPage

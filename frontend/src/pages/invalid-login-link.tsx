import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone';
import type { NextPage } from 'next'

const InvalidLoginLinkPage: NextPage = () => {
  const T: React.FC = ({children}) => <Typography textAlign='center'>{children}</Typography>

  return (
    <StackedBoxes>
      <T><ErrorIcon fontSize='large' sx={{mt: 5}}/></T>
      <T>Unfortunately, your login link has expired.</T>
      <T>Please use the login button again to send a new sign-in email.</T>
    </StackedBoxes>
  )
}

export default InvalidLoginLinkPage

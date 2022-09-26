import { StackedBoxes } from '@/Components/Layout/StackedBoxes'
import { Typography } from '@mui/material'
import ErrorIcon from '@mui/icons-material/NoEncryptionGmailerrorredTwoTone';
import type { NextPage } from 'next'

const ReviewSubmissionsPage: NextPage = () => {
  const T: React.FC = ({children}) => <Typography textAlign='center'>{children}</Typography>

  return (
    <StackedBoxes>
      <T><ErrorIcon fontSize='large' sx={{mt: 5}}/></T>
      <T>Here&apos;s a list of presentations!!!</T>
    </StackedBoxes>
  )
}

export default ReviewSubmissionsPage

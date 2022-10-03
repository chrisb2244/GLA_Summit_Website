import { Button, Box } from '@mui/material'
import type { BoxProps } from '@mui/system'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { useSession } from '@/lib/sessionContext'
import { RegistrationPopup } from '../SigninRegistration/RegistrationPopup'

export const User: React.FC<BoxProps> = ({...extraBoxProps}) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { user, signUp, signIn } = useSession()
  let button
  if (user != null) {
    button = <UserMenu user={user} />
  } else {
    button = (
      <>
        <Button
          onClick={() => setDialogOpen(true)}
          color='warning'
        >
          Sign In / Register
        </Button>
        <RegistrationPopup signUp={signUp} signIn={signIn} open={dialogOpen} setClosed={() => setDialogOpen(false)} />
      </>
    )
  }
  return <Box id='user' {...extraBoxProps}>{button}</Box>
}

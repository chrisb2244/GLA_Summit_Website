import { Button, Box } from '@mui/material'
import type { BoxProps } from '@mui/system'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { NewUserRegistration } from '@/Components/SigninRegistration/NewUserRegistration'
import { UserSignIn } from '@/Components/SigninRegistration/UserSignIn'
import { useSession } from '@/lib/sessionContext'

export const User: React.FC<BoxProps> = ({...extraBoxProps}) => {
  const [dialogOpen, setOpenDialog] = useState<'none' | 'registration' | 'signin'>('none')

  const { user } = useSession()
  let button
  if (user != null) {
    button = <UserMenu user={user} />
  } else {
    button = (
      <>
        <Button
          onClick={() => setOpenDialog('signin')}
          color='warning'
        >
          Sign In / Register
        </Button>
        <NewUserRegistration
          open={dialogOpen === 'registration'}
          setClosed={() => {
            setOpenDialog('none')
          }}
          switchToSignIn={() => {
            setOpenDialog('signin')
          }}
        />
        <UserSignIn
          open={dialogOpen === 'signin'}
          setClosed={() => {
            setOpenDialog('none')
          }}
          switchToRegistration={() => {
            setOpenDialog('registration')
          }}
        />
      </>
    )
  }
  return <Box id='user' {...extraBoxProps}>{button}</Box>
}

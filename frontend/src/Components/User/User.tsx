import { Button } from '@mui/material'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { NewUserRegistration } from '@/Components/SigninRegistration/NewUserRegistration'
import { UserSignIn } from '@/Components/SigninRegistration/UserSignIn'
import { useSession } from '@/lib/sessionContext'

export const User: React.FC = () => {
  const [dialogOpen, setOpenDialog] = useState<'none' | 'registration' | 'signin'>('none')

  const { session } = useSession()
  let button
  if (session != null) {
    button = <UserMenu user={session.user} />
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
  return <div id='user'>{button}</div>
}

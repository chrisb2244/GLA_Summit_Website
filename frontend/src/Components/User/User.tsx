import { Button } from '@mui/material'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { NewUserRegistration } from '@/Components/SigninRegistration/NewUserRegistration'
import { UserSignIn } from '@/Components/SigninRegistration/UserSignIn'
import { useSession } from '@/lib/sessionContext'

export const User: React.FC = () => {
  const [regDialogOpen, setRegistrationOpen] = useState(false)
  const [signInDialogOpen, setSignInOpen] = useState(false)

  const { session } = useSession()
  let button
  if (session != null) {
    button = <UserMenu user={session.user} />
  } else {
    button = (
      <>
        <Button
          onClick={() => setSignInOpen(true)}
          color='warning'
        >
          Sign In / Register
        </Button>
        <NewUserRegistration
          open={regDialogOpen}
          setClosed={() => {
            setRegistrationOpen(false)
          }}
          switchToSignIn={() => {
            setRegistrationOpen(false)
            setSignInOpen(true)
          }}
        />
        <UserSignIn
          open={signInDialogOpen}
          setClosed={() => {
            setSignInOpen(false)
          }}
          switchToRegistration={() => {
            setSignInOpen(false)
            setRegistrationOpen(true)
          }}
        />
      </>
    )
  }
  return <div id='user'>{button}</div>
}

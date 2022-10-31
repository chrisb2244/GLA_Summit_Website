'use client';

import { Button, Box } from '@mui/material'
import type { BoxProps } from '@mui/system'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { useSession } from '@/lib/sessionContext'
// import { SessionContext, signUp } from '@/lib/sessionContext'

import { RegistrationPopup } from '@/Components/SigninRegistration/RegistrationPopup'
import { useSessionContext } from '@supabase/auth-helpers-react';
// import type { User as UserType } from '@/lib/databaseFunctions';

// const signIn: SessionContext['signIn'] = async () => {
//   return {
//     user: null,
//     session: null,
//     error: null
//   }
// }

// const getUser = async (): Promise<UserType> => {
//   return {
//     email: 'test@user.com',
//     id: 'test@user.com',
//     aud: 'authenticated',
//     app_metadata: {},
//     user_metadata: {},
//     created_at: ''
//   }
// }

export const User: React.FC<React.PropsWithChildren<BoxProps>> = ({...extraBoxProps}) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  // const user = use(getUser())
  // const { user, signUp, signIn } = useSession()
  const { session } = useSessionContext()

  let button
  if (session != null) {
    button = <UserMenu user={session.user} />
  } else {
    button = (
      <>
        <Button
          onClick={() => setDialogOpen(true)}
          color='warning'
        >
          Sign In / Register
        </Button>
        {/* <RegistrationPopup signUp={signUp} signIn={signIn} open={dialogOpen} setClosed={() => setDialogOpen(false)} /> */}
      </>
    )
  }
  return <Box id='user' {...extraBoxProps}>{button}</Box>
}

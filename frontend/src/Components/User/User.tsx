import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@mui/material'
import { UserMenu } from '@/Components/User/UserMenu'
import { useState } from 'react'
import { NewUserRegistration } from '@/Components/User/NewUserRegistration'

interface UserProps {}

export const User: React.FC<UserProps> = (props) => {
  const [regDialog, setRegistrationOpen] = useState<HTMLElement | null>(null)
  const registrationDialogOpen = Boolean(regDialog)

  const { data: session } = useSession()
  let button
  if (session != null) {
    button = <UserMenu user={session.user} />
    // (
    //   <Link href="/api/auth/signout" passHref>
    //     <Button
    //       type="button"
    //       color="secondary"
    //       variant="outlined"
    //       href={'/api/auth/signout'}
    //       onClick={(ev) => {
    //         ev.preventDefault()
    //         signOut()
    //       }}
    //     >
    //       {message}
    //     </Button>
    //   </Link>
    // )
  } else {
    button = (
      <>
        {/* <Link href="/api/auth/signin" passHref>
        <Button
          type="button"
          color="secondary"
          href={'/api/auth/signin'}
          onClick={(ev) => {
            ev.preventDefault()
            signIn()
          }}
        >
          Sign In
        </Button>
      </Link> */}
        <Button
          onClick={(ev) => setRegistrationOpen(ev.currentTarget)}
          color='warning'
        >
          Register
        </Button>
        <NewUserRegistration
          open={registrationDialogOpen}
          setClosed={() => {
            setRegistrationOpen(null)
          }}
        />
        <Button onClick={(ev) => signIn()} color='warning'>
          Sign In
        </Button>
      </>
    )
  }
  return <div id='user'>{button}</div>
}

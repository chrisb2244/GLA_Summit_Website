import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@mui/material'

interface UserProps {}

export const User: React.FC<UserProps> = (props) => {
  const { data: session } = useSession()
  let message: string
  let button
  if (session != null) {
    message = `Signed in as ${session.user?.email}`
    button = (<Link href="/api/auth/signout" passHref>
    <Button
      type="button"
      color="secondary"
      href={'/api/auth/signout'}
      onClick={(ev) => {
        ev.preventDefault()
        signOut()
      }}
    >
      Sign Out
    </Button>
  </Link>)
  } else {
    message = 'Not signed in!'
    button = (
      <Link href="/api/auth/signin" passHref>
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
      </Link>
    )
  }
  return (
    <div id="user">
      <p>{message}</p>
      {button}
    </div>
  )
}

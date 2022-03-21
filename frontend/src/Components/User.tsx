import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@mui/material'

interface UserProps {}

export const User: React.FC<UserProps> = (props) => {
  const { data: session } = useSession()
  let button
  if (session != null) {
    const message = session.user?.name ?? session.user?.email ?? ''
    button = (<Link href="/api/auth/signout" passHref>
    <Button
      type="button"
      color="secondary"
      variant='outlined'
      href={'/api/auth/signout'}
      onClick={(ev) => {
        ev.preventDefault()
        signOut()
      }}
    >
      {message}
    </Button>
  </Link>)
  } else {
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
      {button}
    </div>
  )
}

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@mui/material'

interface UserProps {}

export const User: React.FC<UserProps> = (props) => {
  const { data: session } = useSession()
  let message: string
  if (session != null) {
    message = `Signed in as ${session.user?.name}`
  } else {
    message = 'Not signed in!'
  }
  return (
    <div id='user'>
      <p>{message}</p>
      {typeof session == null
        ? null
        : (
          <Link href='/api/auth/signin' passHref>
            <Button color='secondary'>Log In</Button>
          </Link>
          )}
    </div>
  )
}

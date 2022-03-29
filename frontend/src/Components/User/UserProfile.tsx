import { useSession } from 'next-auth/react'

export const UserProfile: React.FC = () => {
  const { data } = useSession()
  if (data == null) {
    return <p>You are not signed in</p>
  } else {
    return (
      <>
        <div>Name: {data.user?.name}</div>
        <div>Email: {data.user?.email}</div>
      </>
    )
  }
}

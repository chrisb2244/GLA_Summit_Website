import { useSession } from 'next-auth/react'

export const UserProfile: React.FC<{}> = (props) => {
  const { data } = useSession()
  if (!data) {
    return <p>You are not signed in</p>
  } else {
    return <>
      <div>Name: {data.user?.name}</div>
      <div>Email: {data.user?.email}</div>
    </>
  }
}

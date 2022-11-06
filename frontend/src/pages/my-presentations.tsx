import { UserPresentations } from '@/Components/User/UserPresentations'
import { useSession } from '@/lib/sessionContext'
import type { MySubmissionsModel } from '@/lib/databaseModels'
import type { Fetcher } from 'swr'
import { getMyPresentations } from '@/lib/databaseFunctions'
import useSWR from 'swr'
import { logErrorToDb, myLog } from '@/lib/utils'

const MyPresentations = (): JSX.Element => {
  const { user } = useSession()
  const keyPrefix = 'presentationdata-'

  const presentationFetcher: Fetcher<MySubmissionsModel[]> = async (key: string | null) => {
    if (key === null) {
      throw new Error('Cannot load presentations without user')
    }
    const myPresentations = (await getMyPresentations()) ?? []
    return myPresentations
  }

  const key = user ? keyPrefix + user.id : null
  const { data, error, isValidating, mutate } = useSWR(key, presentationFetcher)
  
  if (user === null) {
    return <p>You are not signed in</p>
  }

  if (typeof data !== 'undefined') {
    return <UserPresentations presentations={data} userId={user.id} mutate={mutate}/>
  } else if (isValidating) {
    return <p>Loading...</p>
  } else {
    if (error) {
      myLog(error)
      logErrorToDb(error.message, 'error', user?.id)
      return <p>Unable to load presentations...</p>
    }
    return <p>You are not signed in</p>
  }

}

export default MyPresentations

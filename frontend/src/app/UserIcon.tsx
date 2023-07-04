// import { UserMenu } from '@/Components/User/UserMenu'
import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { WaitingIndicator } from '@/Components/WaitingIndicator'

export async function UserIcon () {
  const supabase = createServerComponentClient({ cookies })
  const user = (await supabase.auth.getSession()).data.session?.user

  const idleSpinner = <WaitingIndicator />
  // const button = user == null ? <SignInUpButton /> : <UserMenu user={user} />
  const button = <SignInUpButton waitingSpinner={idleSpinner}/>
  
  return (
    <div id='user' className='flex-grow-0 pr-2'>
      {button}
    </div>
  )
}

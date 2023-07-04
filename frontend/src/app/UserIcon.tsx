import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { WaitingIndicator } from '@/Components/WaitingIndicator'
import { UserMenu } from '@/Components/User/UserMenu'

export async function UserIcon() {
  const supabase = createServerComponentClient({ cookies })
  const user = (await supabase.auth.getSession()).data.session?.user

  const idleSpinner = <WaitingIndicator />
  const button =
    user == null ? (
      <SignInUpButton waitingSpinner={idleSpinner} />
    ) : (
      <UserMenu user={user} />
    )

  return (
    <div id='user' className='flex-grow-0 pr-2'>
      {button}
    </div>
  )
}

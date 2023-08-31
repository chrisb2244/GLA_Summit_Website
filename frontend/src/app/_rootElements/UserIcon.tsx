import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator'
import { UserMenu } from '@/Components/User/UserMenu'
import { Database } from '@/lib/sb_databaseModels'

export async function UserIcon() {
  const supabase = createServerComponentClient<Database>({ cookies })
  const user = (await supabase.auth.getSession()).data.session?.user
  const isOrganizer =
    typeof user !== 'undefined'
      ? await supabase
          .from('organizers')
          .select()
          .eq('id', user.id)
          .maybeSingle()
          .then((v) => v !== null)
      : false

  const idleSpinner = <WaitingIndicator />
  const button =
    user == null ? (
      <SignInUpButton waitingSpinner={idleSpinner} />
    ) : (
      <UserMenu user={user} isOrganizer={isOrganizer} />
    )

  return (
    <div id='user' className='flex h-full flex-grow-0 pr-2'>
      {button}
    </div>
  )
}

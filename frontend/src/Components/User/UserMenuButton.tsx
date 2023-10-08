import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton'
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator'
import { UserMenu } from '@/Components/User/UserMenu'
import {
  getIsOrganizer,
  signOut
} from '@/Components/SigninRegistration/SignInUpActions'
import { createServerComponentClient } from '@/lib/supabaseServer'

export async function UserMenuButton() {
  const supabase = createServerComponentClient()

  const updateUserClient = async () => {
    "use server"
    console.log("Updating user login...")
  }

  const user = (await supabase.auth.getUser()).data.user
  const isOrganizer = user === null ? false : await getIsOrganizer(user);

  const idleSpinner = <WaitingIndicator />
  const button = user == null ? (
    <SignInUpButton
      waitingSpinner={idleSpinner}
      onSignInComplete={updateUserClient}
    />
  ) : (
    <UserMenu user={user} isOrganizer={isOrganizer} signOut={signOut} />
  )

  return (
    <div id='user' className='flex h-full flex-grow-0 pr-2'>
      {button}
    </div>
  )
}

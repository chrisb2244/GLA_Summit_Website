import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton';
import { UserMenu } from '@/Components/User/UserMenu';
import { signOut } from '@/Components/SigninRegistration/SignInUpActions';
import { getUserDataForMenu } from '@/lib/supabase/userFunctions';

export async function UserMenuButton() {
  const userData = await getUserDataForMenu();

  const button =
    userData == null ? (
      <SignInUpButton />
    ) : (
      <UserMenu
        user={userData.user}
        isOrganizer={userData.isOrganizer}
        profile={userData.profile}
        signOut={signOut}
      />
    );

  return (
    <div id='user' className='flex h-full grow-0 pr-2'>
      {button}
    </div>
  );
}

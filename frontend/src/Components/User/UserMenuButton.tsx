import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton';
import { UserMenu } from '@/Components/User/UserMenu';
import { signOut } from '@/Components/SigninRegistration/SignInUpActions';
import { getUserDataForMenu } from '@/lib/supabase/userFunctions';
import { prefetch } from 'next/cache';

export async function UserMenuButton() {
  // Keep the session read out of the App Shell.
  // Below `prefetch()` the shells can be served from the static build output
  // instead.
  // Must stay inside the <Suspense> in Header.tsx.
  await prefetch();
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
    <div id='user' className='flex grow-0 self-stretch'>
      {button}
    </div>
  );
}

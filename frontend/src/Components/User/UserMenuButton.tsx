import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton';
import { WaitingIndicator } from '@/Components/Utilities/WaitingIndicator';
import { UserMenu } from '@/Components/User/UserMenu';
import { signOut } from '@/Components/SigninRegistration/SignInUpActions';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { User } from '@supabase/supabase-js';

export async function UserMenuButton() {
  const supabase = createServerComponentClient();

  const updateUserClient = async () => {
    'use server';
    console.log('Updating user login...');
  };

  const user = (await supabase.auth.getUser()).data.user;

  const getIsOrganizer = async (user: User | null) => {
    if (user === null) {
      return false;
    }
    const { data, error } = await supabase
      .from('organizers')
      .select()
      .eq('id', user.id);
    if (error) {
      console.log({ getOrganizerError: error });
      return false;
    }
    return data.length === 1;
  };
  const isOrganizer = await getIsOrganizer(user);

  const idleSpinner = <WaitingIndicator />;
  const button =
    user == null ? (
      <SignInUpButton
        waitingSpinner={idleSpinner}
        onSignInComplete={updateUserClient}
      />
    ) : (
      <UserMenu user={user} isOrganizer={isOrganizer} signOut={signOut} />
    );

  return (
    <div id='user' className='flex h-full flex-grow-0 pr-2'>
      {button}
    </div>
  );
}

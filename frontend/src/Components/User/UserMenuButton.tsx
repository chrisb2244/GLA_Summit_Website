import { SignInUpButton } from '@/Components/SigninRegistration/SignInUpButton';
import { UserMenu } from '@/Components/User/UserMenu';
import { signOut } from '@/Components/SigninRegistration/SignInUpActions';
import { createServerComponentClient } from '@/lib/supabaseServer';
import { User } from '@supabase/supabase-js';
import { getUser } from '@/lib/supabase/userFunctions';

export async function UserMenuButton() {
  const user = await getUser();

  const supabase = createServerComponentClient();

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

  const getProfile = async (user: User | null) => {
    if (user === null) {
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, firstname, lastname, bio, website, avatar_url, updated_at')
      .eq('id', user.id)
      .single();
    if (error) {
      console.log({ error, m: 'Fetching profile' });
      return null;
    }
    return data;
  };
  const profile = await getProfile(user);

  const button =
    user == null ? (
      <SignInUpButton />
    ) : (
      <UserMenu
        user={user}
        isOrganizer={isOrganizer}
        profile={profile}
        signOut={signOut}
      />
    );

  return (
    <div id='user' className='flex h-full flex-grow-0 pr-2'>
      {button}
    </div>
  );
}

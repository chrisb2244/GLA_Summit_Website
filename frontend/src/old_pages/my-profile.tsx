import { UserProfile } from '@/Components/User/UserProfile';
import { ProfileModel } from '@/lib/databaseModels';
import { useSession } from '@/lib/sessionContext';
import { supabase } from '@/lib/supabaseClient';
import { myLog } from '@/lib/utils';
import useSWR, { Fetcher } from 'swr';

const MyProfile = (): JSX.Element => {
  const keyPrefix = 'profiledata-';
  const profileFetcher: Fetcher<ProfileModel['Row']> = async (
    key: string | null
  ) => {
    if (key === null) {
      throw new Error('Cannot load profile without user');
    }
    const userId = key.slice(keyPrefix.length);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      throw error;
    }
    return data;
  };

  const { user } = useSession();
  const key = user ? keyPrefix + user.id : null;
  // The user should always have an email (we only allow generation by email account)
  // and if there is no user, the profile won't render, so userEmail is valid when used.
  const userEmail = user ? user.email ?? 'Email Not Found' : 'User Not Found';

  const { data, error, isValidating, mutate } = useSWR(key, profileFetcher);

  if (typeof data !== 'undefined') {
    return <UserProfile profile={data} mutate={mutate} userEmail={userEmail} />;
  } else if (isValidating) {
    return <p>Loading...</p>;
  } else {
    if (error) {
      myLog({ error });
      return <p>Unable to load profile...</p>;
    }
    return <p>You are not signed in</p>;
  }
};

export default MyProfile;

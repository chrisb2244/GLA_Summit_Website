import { Database } from '@/lib/sb_databaseModels';
import { createServerComponentClient } from '@/lib/supabaseServer';

import React, { PropsWithChildren } from 'react';
import { ProfileImage } from './ProfileImage';
import { ProfileForm } from './ProfileForm';

const ProfilePage = async () => {
  const supabase = createServerComponentClient();
  const user = (await supabase.auth.getSession()).data.session?.user;

  const Wrapper: React.FC<PropsWithChildren> = (props) => {
    return <div className='mb-4 flex flex-col'>{props.children}</div>;
  };

  if (typeof user === 'undefined') {
    return (
      <Wrapper>
        <p>This page requires that you be logged-in.</p>
      </Wrapper>
    );
  }

  const userId = user.id;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    return (
      <Wrapper>
        <p>Unable to load profile...</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className='flex flex-col md:flex-row'>
        {/* Layout for the text boxes/form */}
        <div className='m-4 flex w-4/5 flex-col self-center md:self-start'>
          <ProfileForm profile={data} email={user.email ?? 'Email Not Found'} />
        </div>

        {/* Profile image */}
        <div className='flex min-h-[80vw] w-4/5 flex-col self-center md:min-h-[300px] md:w-1/5 '>
          <ProfileImage userId={userId} avatarUrl={data.avatar_url} />
        </div>
      </div>
    </Wrapper>
  );
};

export default ProfilePage;

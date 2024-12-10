import { createServerClient } from '@/lib/supabaseServer';
import React, { Suspense, PropsWithChildren, cache } from 'react';
import { ProfileImage } from './ProfileImage';
import { ProfileForm } from './ProfileForm';
import { getUser } from '@/lib/supabase/userFunctions';

const Wrapper: React.FC<PropsWithChildren> = (props) => {
  return <div className='mb-4 flex flex-col'>{props.children}</div>;
};

const ProfilePage = async () => {
  return (
    <Wrapper>
      <div className='flex flex-col md:flex-row'>
        {/* Layout for the text boxes/form */}
        <div className='m-4 flex w-4/5 flex-col self-center md:self-start'>
          <Suspense>
            <ProfilePage_FormWrapper />
          </Suspense>
        </div>

        {/* Profile image */}
        <div className='flex min-h-[80vw] w-4/5 flex-col self-center md:min-h-[300px] md:w-1/5 '>
          <Suspense>
            <ProfilePage_ImageWrapper />
          </Suspense>
        </div>
      </div>
    </Wrapper>
  );
};

const getProfileData = cache(async (userId: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }
  return data;
});

const ProfilePage_FormWrapper = async () => {
  const user = await getUser();
  if (user === null) {
    return (
      <Wrapper>
        <p>This page requires that you be logged-in.</p>
      </Wrapper>
    );
  }

  const profileData = await getProfileData(user.id);

  if (profileData === null) {
    return (
      <Wrapper>
        <p>Unable to load profile...</p>
      </Wrapper>
    );
  }

  return (
    <ProfileForm
      profile={profileData}
      email={user.email ?? 'Email Not Found'}
    />
  );
};

const ProfilePage_ImageWrapper = async () => {
  const user = await getUser();
  if (user === null) {
    return null;
  }
  const avatar_url = await getProfileData(user.id).then(
    (data) => data?.avatar_url
  );
  return avatar_url ? (
    <ProfileImage userId={user.id} avatarUrl={avatar_url} />
  ) : null;
};

export default ProfilePage;

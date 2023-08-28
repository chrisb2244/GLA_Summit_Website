import { Database } from '@/lib/sb_databaseModels'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import React, { PropsWithChildren } from 'react'
import { ProfileImage } from './ProfileImage'
import { ProfileForm } from './ProfileForm'

const ProfilePage = async () => {
  const supabase = createServerComponentClient<Database>({ cookies })
  const user = (await supabase.auth.getSession()).data.session?.user

  const Wrapper: React.FC<PropsWithChildren> = (props) => {
    return <div className=''>{props.children}</div>
  }

  if (typeof user === 'undefined') {
    return (
      <Wrapper>
        <p>This page requires that you be logged-in.</p>
      </Wrapper>
    )
  }

  const userId = user.id
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    return (
      <Wrapper>
        <p>Unable to load profile...</p>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className='flex flex-col md:flex-row'>
        {/* Layout for the text boxes/form */}
        <div className='flex flex-col m-4 w-4/5 self-center md:self-start'>
          <ProfileForm profile={data} email={user.email ?? 'Email Not Found'} />
        </div>

        {/* Profile image */}
        <div className='flex flex-col w-4/5 md:w-1/5 self-center min-h-[80vw] md:min-h-[300px] '>
          <ProfileImage userId={userId} avatarUrl={data.avatar_url} />
        </div>
      </div>
    </Wrapper>
  )
}

export default ProfilePage

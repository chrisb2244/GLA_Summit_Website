'use client';
import { uploadAvatar } from '@/lib/databaseFunctions';
import { useProfileImage } from '@/lib/profileImage';
import { ChangeEvent, useState } from 'react';
import NextImage from 'next/image';
import { FileButton } from '@/Components/Form/Button';
import Icon from '@mdi/react';
import { mdiAccountBox } from '@mdi/js';

type ProfileImageProps = {
  userId: string;
  avatarUrl: string | null;
};

export const ProfileImage = (props: ProfileImageProps) => {
  const { userId, avatarUrl } = props;
  const [uploading, setUploading] = useState(false);

  const { src: profileImageSrc, mutate } = useProfileImage(userId) || {};

  const imageUploadFn = async (file: File) => {
    const extn = file.name.split('.').pop();
    const remoteName = `${userId}_${Math.random()}.${extn}`;
    setUploading(true);
    uploadAvatar(remoteName, file, userId, avatarUrl).finally(() => {
      setUploading(false);
      mutate?.();
    });
  };

  // 900px is md size
  const avatar =
    typeof profileImageSrc !== 'undefined' ? (
      <NextImage
        src={profileImageSrc}
        alt='Profile image'
        fill
        style={{ objectFit: 'contain' }}
        sizes='(max-width: 900px) 80vw, 20vw'
      />
    ) : (
      <Icon
        path={mdiAccountBox}
        color='grey'
        id='placeholder-profile-icon'
        title='Placeholder profile image'
      />
    );

  const changeHandler = (ev: ChangeEvent<HTMLInputElement>) => {
    const fileList = ev.target.files;
    if (fileList != null && fileList[0] != null) {
      imageUploadFn(fileList[0]);
    }
  };

  return (
    <>
      <div className='relative flex-grow'>{avatar}</div>
      <div className='mx-4 mt-2 flex'>
        <FileButton
          className='mx-4 mt-2'
          id='image-input'
          accept='image/*'
          onChange={changeHandler}
          fullWidth
        >
          {uploading ? 'Uploading' : 'Change Image'}
        </FileButton>
      </div>
    </>
  );
};

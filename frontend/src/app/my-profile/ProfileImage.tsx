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
};

export const ProfileImage = (props: ProfileImageProps) => {
  const { userId } = props;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { src: profileImageSrc, mutate } = useProfileImage(userId);

  const imageUploadFn = async (file: File) => {
    const extn = file.name.split('.').pop();
    const remoteName = `${userId}_${Math.random()}.${extn}`;
    setUploading(true);
    setError(null);
    try {
      // Cleanup of the old image is managed server-side,
      // so this call doesn't need to provide the old path
      await uploadAvatar(remoteName, file);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not upload that image.'
      );
    } finally {
      setUploading(false);
      // Re-download the stored avatar: on success this is the new image, on
      // failure it restores the one that is still in place.
      mutate();
    }
  };

  // 900px is md size
  const avatar =
    profileImageSrc !== null ? (
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
      <div className='relative grow'>{avatar}</div>
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
      {error !== null && (
        <p className='mx-4 mt-2 text-sm text-red-700' role='alert'>
          {error}
        </p>
      )}
    </>
  );
};

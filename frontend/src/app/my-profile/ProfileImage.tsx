'use client'
import { uploadAvatar } from '@/lib/databaseFunctions'
import { useProfileImage } from '@/lib/profileImage'
import { ChangeEvent, useState } from 'react'
import NextImage from 'next/image'
import { FileButton } from '@/Components/Form/Button'
import Icon from '@mdi/react'
import { mdiAccountBox } from '@mdi/js'

type ProfileImageProps = {
  userId: string
  avatarUrl: string | null
}

export const ProfileImage = (props: ProfileImageProps) => {
  const { userId, avatarUrl } = props
  const [uploading, setUploading] = useState(false)

  const { src: profileImageSrc, mutate } = useProfileImage(userId) || {}

  const imageUploadFn = async (file: File) => {
    const remoteName = `${userId}_${Math.random()}.png`
    setUploading(true)
    uploadAvatar(remoteName, file, userId, avatarUrl).finally(() => {
      setUploading(false)
      mutate?.()
    })
  }

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
      <Icon path={mdiAccountBox} color='grey' />
    )

  const changeHandler = (ev: ChangeEvent<HTMLInputElement>) => {
    const fileList = ev.target.files
    if (fileList != null && fileList[0] != null) {
      imageUploadFn(fileList[0])
    }
  }

  return (
    <>
      <div className='relative flex-grow'>{avatar}</div>
      <FileButton
        className='w-full h-full bg-red-300 flex'
        id='image-input'
        accept='image/*'
        onChange={changeHandler}
      >
        {uploading ? 'Uploading' : 'Change Image'}
      </FileButton>
    </>
  )
}

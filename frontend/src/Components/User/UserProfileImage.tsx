import { Stack, Button, Box } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import Image from 'next/image'
import { uploadProfileImage, useProfileImage } from '@/lib/profileImage'
import { useSWRConfig } from 'swr'
import { useState } from 'react'

type UserProfileImageProps = {
  avatarUrl: string | null
  userId: string
  size: number
}

export const UserProfileImage: React.FC<UserProfileImageProps> = (props) => {
  const { src: profileImageSrc, loading } = useProfileImage(props.userId) || {}
  const sizeInfo = { width: props.size, height: props.size }

  const imageComponent = !!profileImageSrc ? (
    // See https://nextjs.org/docs/api-reference/next/image for sizing
    <Box position='relative' {...sizeInfo} mx='auto'>
      <Image
        src={profileImageSrc}
        alt='profile image'
        fill
        style={{ objectFit: 'contain' }}
      />
    </Box>
  ) : !loading ? (
    <PersonIcon
      sx={{
        backgroundColor: 'lightgrey',
        ...sizeInfo
      }}
    />
  ) : (
    <div style={{ ...sizeInfo }}>Loading...</div>
  )

  const { mutate } = useSWRConfig()
  const [uploading, setUploading] = useState(false)

  return (
    <Stack>
      {imageComponent}
      <Button component='label' sx={{mx: 'auto' }} >
        {uploading ? 'Uploading...' : 'Change Image'}
        <input
          type='file'
          hidden
          id='image-input'
          accept='image/*'
          onChange={(ev) => {
            const fileList = ev.target.files
            if (fileList != null && fileList[0] != null) {
              setUploading(true)
              uploadProfileImage(
                `${props.userId}_${Math.random()}.png`,
                fileList[0],
                props.userId,
                mutate,
                props.avatarUrl
              ).finally(() => setUploading(false))
            }
          }}
          disabled={uploading}
        />
      </Button>
    </Stack>
  )
}

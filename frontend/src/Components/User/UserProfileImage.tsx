import { Stack, Button } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import Image from 'next/image'
import { uploadProfileImage, useProfileImage } from '@/lib/profileImage'
import { useSWRConfig } from 'swr'
import { useSession } from '@/lib/sessionContext'

type UserProfileImageProps = {
  userId: string
  size: number
}

export const UserProfileImage: React.FC<UserProfileImageProps> = (props) => {
  const { profile } = useSession()
  const { src: profileImageSrc, loading } = useProfileImage(props.userId) || {}
  const sizeInfo = { width: props.size, height: props.size }

  const imageComponent = !!profileImageSrc ? (
    // See https://nextjs.org/docs/api-reference/next/image for sizing
    <Image src={profileImageSrc} alt='profile image' {...sizeInfo} />
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
  const uploading = false

  return (
    <Stack>
      {imageComponent}
      <Button component='label'>
        {uploading ? 'Uploading...' : 'Change Image'}
        <input
          type='file'
          hidden
          id='image-input'
          accept='image/*'
          onChange={(ev) => {
            const fileList = ev.target.files
            if (fileList != null && fileList[0] != null) {
              uploadProfileImage(
                `${props.userId}_${Math.random()}.png`,
                fileList[0],
                props.userId,
                mutate,
                profile?.avatar_url ?? null
              )
            }
          }}
          disabled={uploading}
        />
      </Button>
    </Stack>
  )
}

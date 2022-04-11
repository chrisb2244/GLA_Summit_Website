import { Stack, Button } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import Image from 'next/image'

export const UserProfileImage: React.FC<{avatarUrl: string | null}> = (props) => {
  return (
    <Stack>
      {!!props.avatarUrl ? (
        // Probably need width and height values here, see
        // https://nextjs.org/docs/api-reference/next/image
        <Image src={props.avatarUrl} alt='profile image'/>
      ) : (
        <PersonIcon
          sx={{
            backgroundColor: 'lightgrey',
            width: '100%',
            height: 'auto'
          }}
        />
      )}
      <Button>Change Image</Button>
    </Stack>
  )
}

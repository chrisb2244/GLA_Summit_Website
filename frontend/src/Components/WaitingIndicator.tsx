import NextImage from 'next/image'
import GLA_Logo from '@/media/GLA-logo-spinnable.svg'
import { Box, Dialog } from '@mui/material'

type WaitingIndicatorProps = {
  open: boolean
  onClose: () => void
  scale?: number
  maxLength?: number
}

export const WaitingIndicator: React.FC<WaitingIndicatorProps> = ({
  open,
  onClose,
  scale = 0.3,
  maxLength = 300,
  children
}) => {
  const length = Math.min(scale * screen.width, maxLength)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { backgroundColor: 'transparent', boxShadow: 'none' } }}
    >
      <Box
        sx={{
          '@keyframes rotation': {
            from: {
              transform: 'rotate(0deg)'
            },
            to: {
              transform: 'rotate(360deg)'
            }
          }
        }}
      >
        <NextImage
          src={GLA_Logo}
          width={length}
          height={length}
          style={{
            animation: 'rotation 10s infinite linear'
          }}
          alt='loading indicator'
        />
        {children}
      </Box>
    </Dialog>
  )
}

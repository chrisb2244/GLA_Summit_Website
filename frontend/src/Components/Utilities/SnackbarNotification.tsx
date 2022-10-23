import { Snackbar, IconButton, Box } from '@mui/material'
import type { SnackbarOrigin } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useState } from 'react'

type NotificationProps = {
  open?: boolean
  anchorOrigin?: SnackbarOrigin
  maxWidth?: string
}

export const SnackbarNotification: React.FC<NotificationProps> = (props) => {
  const [open, setOpen] = useState(props.open)

  return (
    <Snackbar
      sx={{ maxWidth: props.maxWidth }}
      open={open}
      autoHideDuration={6000}
      anchorOrigin={props.anchorOrigin}
      action={
        <>
          <Box display='flex' flexDirection='column' py={1} mr={1}>
            {props.children}
          </Box>
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </>
      }
    />
  )
}

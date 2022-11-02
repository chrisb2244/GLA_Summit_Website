import { Container, Dialog } from '@mui/material'

type NotificationDialogPopupProps = {
  open: boolean
  onClose: () => void
  children?: React.ReactNode
}

export const NotificationDialogPopup: React.FC<
  NotificationDialogPopupProps
> = ({ open, onClose, children }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <Container maxWidth='md' sx={{ p: 2 }}>
        {children}
      </Container>
    </Dialog>
  )
}

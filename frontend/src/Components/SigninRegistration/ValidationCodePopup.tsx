import { Typography } from '@mui/material'
import { CenteredDialog } from '../Layout/CenteredDialog'
import { ValidateLoginForm } from '../Forms/ValidateLoginForm'
// import { useRouter } from 'next/router'

type ValidationCodePopupProps = {
  open: boolean
  setClosed: () => void
  email?: string
}

export const ValidationCodePopup: React.FC<ValidationCodePopupProps> = (props) => {
  const {
    open,
    setClosed,
    email
  } = props

  return (
      <CenteredDialog open={open} onClose={setClosed} dialogId='validateCodeDialog'>
          <Typography>
            An email has been sent to <b>{email}</b>. Please copy the code
            from that email into the boxes below to sign in.
          </Typography>
          <ValidateLoginForm email={email} />
      </CenteredDialog>
  )
}

import { Link } from '@mui/material'
import type { SignInOptions, SignInReturn } from '@/lib/sessionContext'
import { SmallCenteredText } from '@/Components/Utilities/SmallCenteredText'
import { SignInForm, SignInFormValues } from '../Forms/SignInForm'
import { CenteredDialog } from '../Layout/CenteredDialog'
import { SubmitHandler } from 'react-hook-form'

type SignInProps = {
  open: boolean
  setClosed: () => void
  switchToRegistration: () => void
  onSubmit: SubmitHandler<SignInFormValues>
}

export type SignInFunction = (
  email: string,
  options?: SignInOptions | undefined
) => Promise<SignInReturn>

export const UserSignIn: React.FC<SignInProps> = (props) => {
  const { open, setClosed, switchToRegistration, onSubmit } = props

  return (
    <>
      <CenteredDialog open={open} onClose={setClosed} dialogId='loginDialog'>
        <SmallCenteredText sx={{ pb: 1 }}>
          In order to sign in, enter the email address you used to register for
          this website. Once completed, you will receive an email with a
          verification code.
        </SmallCenteredText>
        <SmallCenteredText sx={{ pb: 2 }}>
          Not registered?{' '}
          <Link
            onClick={(ev) => {
              ev.preventDefault()
              switchToRegistration()
            }}
            component='button'
          >
            Join Now
          </Link>
        </SmallCenteredText>
        <SignInForm onSubmit={onSubmit} />
      </CenteredDialog>
    </>
  )
}

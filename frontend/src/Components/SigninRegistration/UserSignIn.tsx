import type { SignInOptions, SignInReturn } from '@/lib/sessionContext'
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
    <CenteredDialog open={open} onClose={setClosed} dialogId='loginDialog'>
      <div className='flex flex-col space-y-1 px-4 text-sm items-center text-center pb-4'>
        <p>
          In order to sign in, enter the email address you used to register for
          this website.
        </p>
        <p>
          Once completed, you will receive an email with a single-use
          verification code.
        </p>
        <p>
          <span>{'Not registered?\u00A0'}</span>
          <a
            className='link'
            onClick={(ev) => {
              ev.preventDefault()
              switchToRegistration()
            }}
          >
            Join Now
          </a>
        </p>
      </div>
      <SignInForm onSubmit={onSubmit} />
    </CenteredDialog>
  )
}

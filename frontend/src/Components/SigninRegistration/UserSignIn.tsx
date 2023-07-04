import {
  Container,
  Dialog,
  Link,
  Typography
} from '@mui/material'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useCallback, useEffect, useState } from 'react'
import type { SignInOptions, SignInReturn } from '@/lib/sessionContext'
import { NotificationDialogPopup } from '../NotificationDialogPopup'
import { SmallCenteredText } from '@/Components/Utilities/SmallCenteredText'
import { signIn, verifyLogin } from './SignInUpActions'
import { SignInForm, SignInFormValues } from '../Forms/SignInForm'
// import { useRouter } from 'next/router'

type SignInProps = {
  open: boolean
  setClosed: () => void
  switchToRegistration: () => void
  waitingSpinner: JSX.Element
}

export type SignInFunction = (
  email: string,
  options?: SignInOptions | undefined
) => Promise<SignInReturn>

export const UserSignIn: React.FC<SignInProps> = ({
  open,
  setClosed,
  waitingSpinner,
  switchToRegistration
}) => {
  const [feedbackPopup, setFeedbackPopup] = useState<{
    state: 'valid' | 'invalid'
    email: string
  } | null>(null)
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null)



  const [isWaiting, setIsWaiting] = useState(false)

  // TODO: I think the callback here is preventing new OTPs being generated
  // Consider adding 'email' to the dependencies, or removing the callback?
  const signinCallback = useCallback(
    (email: string) => {
      signIn(email, {
        redirectTo: new URL(window.location.href).origin + '/'
      }).then((emailSent) => {
        if (!emailSent) {
          setFeedbackPopup({ state: 'invalid', email })
        } else {
          setFeedbackPopup({ state: 'valid', email })
        }
        setIsWaiting(false)
      })
      setClosed()
      setAttemptedEmail(null)
    },
    [signIn, setClosed]
  )

  useEffect(() => {
    if (attemptedEmail == null) {
      return
    }
    setIsWaiting(true)
    signinCallback(attemptedEmail)
  }, [attemptedEmail, signinCallback])

  const onSubmit: SubmitHandler<SignInFormValues> = async ({ email }) => {
    setAttemptedEmail(email)
  }

  // const router = useRouter()
  const checkLogin = async (data: FormData) => {
    const email = data.get('email')
    const verificationCode = data.get('verification_code')
    if (
      verificationCode === null ||
      typeof verificationCode !== 'string' ||
      email === null ||
      typeof email !== 'string'
    ) {
      return
    }

    verifyLogin({email, verificationCode})
      .then(({ user, session }) => {
        console.log({ m: 'Logged in', user, session })
      })
      .then(() => {
        // router.reload()
      })
  }

  const popupText = (
    v: { state: 'valid' | 'invalid'; email: string } | null
  ) => {
    if (v == null) {
      return null
    }
    if (v.state === 'valid') {
      return (
        <>
          <Typography>
            An email has been sent to <b>{v.email}</b>. Please copy the code
            from that email into the boxes below to sign in.
          </Typography>
          <form action={checkLogin}>
            <input type='hidden' name='email' value={v.email} />
            <input type='text' name='verification_code' className='font-lg' />
            <button type='submit'>Submit</button>
          </form>
        </>
      )
    } else if (v.state === 'invalid') {
      return (
        <Typography>
          The email you gave, <b>{v.email}</b>, was not found.
        </Typography>
      )
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setClosed()
          // reset({ email: '' })
        }}
        id='loginDialog'
      >
        <Container maxWidth='md' sx={{ p: 2 }}>
          <SmallCenteredText sx={{ pb: 1 }}>
            In order to sign in, enter the email address you used to register
            for this website. Once completed, you will receive an email with a
            verification link. Open this link to automatically sign into the
            site.
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
          <SignInForm />
        </Container>
      </Dialog>

      <NotificationDialogPopup
        open={feedbackPopup !== null}
        onClose={() => {
          setFeedbackPopup(null)
        }}
      >
        {popupText(feedbackPopup)}
      </NotificationDialogPopup>
      {isWaiting ? waitingSpinner : null}
    </>
  )
}

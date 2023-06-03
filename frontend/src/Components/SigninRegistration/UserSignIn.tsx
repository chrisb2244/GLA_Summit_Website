import {
  Box,
  Button,
  Container,
  Dialog,
  Link,
  TextField,
  Typography
} from '@mui/material'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useCallback, useEffect, useState } from 'react'
import type { SignInOptions, SignInReturn } from '@/lib/sessionContext'
import { myLog } from '@/lib/utils'
import { NotificationDialogPopup } from '../NotificationDialogPopup'
import { SmallCenteredText } from '@/Components/Utilities/SmallCenteredText'
import { signIn } from './SignInUpActions'

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

type SignInFormValues = {
  email: string
}

export const UserSignIn: React.FC<React.PropsWithChildren<SignInProps>> = ({
  setClosed,
  waitingSpinner,
  ...props
}) => {
  const [feedbackPopup, setFeedbackPopup] = useState<{
    state: 'valid' | 'invalid'
    email: string
  } | null>(null)
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null)

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormValues>({
    mode: 'onTouched'
  })

  const [isWaiting, setIsWaiting] = useState(false)
  const signinCallback = useCallback(
    (email: string) => {
      signIn(email).then(({ data, error }) => {
        if (error) {
          myLog(error)
          setFeedbackPopup({ state: 'invalid', email })
        } else {
          console.log(data.properties)
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

  const BoldEmail = (props: { email: string | null }) => {
    return (
      <Box component='span' fontWeight={500}>
        {props.email}
      </Box>
    )
  }

  const popupText = (
    v: { state: 'valid' | 'invalid'; email: string } | null
  ) => {
    if (v == null) {
      return null
    }
    if (v.state === 'valid') {
      return (
        <Typography>
          An email has been sent to <BoldEmail email={v.email} />. Please use
          the link in that email to sign in.
        </Typography>
      )
    } else if (v.state === 'invalid') {
      return (
        <Typography>
          The email you gave, <BoldEmail email={v.email} />, was not found.
        </Typography>
      )
    }
  }

  const emailErrorProps = () => {
    const error = errors.email
    const isError = !!errors.email
    return {
      error: isError,
      helperText: error?.message,
      FormHelperTextProps: { role: isError ? ' alert' : undefined }
    }
  }

  return (
    <>
      <Dialog open={props.open} onClose={() => {
          setClosed()
          reset({ email: '' })
        }}
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
                props.switchToRegistration()
              }}
              component='button'
            >
              Join Now
            </Link>
          </SmallCenteredText>
          <form onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}>
            <Box mb={2}>
              <TextField
                fullWidth
                label='Email'
                autoComplete='email'
                {...register('email', {
                  required: 'Required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "This email doesn't match the expected pattern"
                  }
                })}
                {...emailErrorProps()}
              />
            </Box>
            <Button type='submit' variant='outlined' fullWidth>
              Log In
            </Button>
          </form>
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

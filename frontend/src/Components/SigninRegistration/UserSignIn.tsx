import {
  Box,
  Button,
  Container,
  Dialog,
  Link,
  TextField,
  Typography
} from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useCallback, useEffect, useState } from 'react'
import type { SignInOptions, SignInReturn } from '@/lib/sessionContext'
import { myLog } from '@/lib/utils'
import { NotificationDialogPopup } from '../NotificationDialogPopup'
import { WaitingIndicator } from '../WaitingIndicator'

type SignInProps = {
  open: boolean
  setClosed: () => void
  switchToRegistration: () => void
  signIn: (
    email: string,
    options?: SignInOptions | undefined
  ) => Promise<SignInReturn>
}

type SignInFormValues = {
  email: string
}

const SmallCenteredText: React.FC<TypographyProps> = ({
  children,
  ...typographyProps
}) => {
  return (
    <Typography
      variant='body2'
      fontSize='small'
      align='center'
      {...typographyProps}
    >
      {children}
    </Typography>
  )
}

export const UserSignIn: React.FC<SignInProps> = ({
  signIn,
  setClosed,
  ...props
}) => {
  const [feedbackPopup, setFeedbackPopup] = useState<{
    state: 'valid' | 'invalid'
    email: string
  } | null>(null)
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<SignInFormValues>()

  const [isWaiting, setIsWaiting] = useState(false)
  const signinCallback = useCallback((email: string) => {
      signIn(email).then(({ error }) => {
        if (error) {
          myLog(error)
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

  return (
    <>
      <Dialog open={props.open} onClose={setClosed}>
        <form onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}>
          <Container maxWidth='md' sx={{ p: 2 }}>
            <SmallCenteredText sx={{ pb: 2 }}>
              In order to sign in, enter the email address you used to register
              for this website. Once completed, you will receive an email with a
              verification link. Open this link to automatically sign into the
              site.
            </SmallCenteredText>
            <Box mb={2}>
              <TextField
                fullWidth
                label='Email'
                autoComplete='email'
                {...register('email', {
                  required: true,
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email'
                  }
                })}
              />
            </Box>
            <Button type='submit' variant='outlined' fullWidth>
              Log In
            </Button>
            <SmallCenteredText sx={{ pt: 2 }}>
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
          </Container>
        </form>
      </Dialog>

      <NotificationDialogPopup
        open={feedbackPopup !== null}
        onClose={() => {
          setFeedbackPopup(null)
        }}
      >
        {popupText(feedbackPopup)}
      </NotificationDialogPopup>
      <WaitingIndicator
        open={isWaiting}
        onClose={() => {
          return
        }}
      />
    </>
  )
}

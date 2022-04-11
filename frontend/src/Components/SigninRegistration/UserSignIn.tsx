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
import { useState } from 'react'
import { useSession } from '@/lib/sessionContext'

type SignInProps = {
  open: boolean
  setClosed: () => void
  switchToRegistration: () => void
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

export const UserSignIn: React.FC<SignInProps> = (props) => {
  const [feedbackPopup, setFeedbackPopup] = useState<
    'valid' | 'invalid' | null
  >(null)
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null)

  const { signIn } = useSession()

  const { register, handleSubmit } = useForm<SignInFormValues>()
  const onSubmit: SubmitHandler<SignInFormValues> = async ({ email }) => {
    signIn(email, { redirectTo: 'http://localhost:3000' }).then(
      ({ session, user, error }) => {
        props.setClosed()
        setAttemptedEmail(email)
        if (error) {
          console.log(error)
          setFeedbackPopup('invalid')
        } else {
          console.log({ session, user })
          setFeedbackPopup('valid')
        }
      }
    )
  }

  const BoldEmail = (props: { email: string | null }) => {
    return (
      <Box component='span' fontWeight={500}>
        {props.email}
      </Box>
    )
  }
  const invalidEmailContent = (
    <Typography>
      The email you gave, <BoldEmail email={attemptedEmail} />, was not found.
    </Typography>
  )

  const validEmailContent = (
    <Typography>
      An email has been sent to <BoldEmail email={attemptedEmail} />. Please use
      the link in that email to sign in.
    </Typography>
  )

  return (
    <>
      <Dialog open={props.open} onClose={props.setClosed}>
        <form onSubmit={handleSubmit(onSubmit)}>
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

      {feedbackPopup !== null && <Dialog
        open={feedbackPopup !== null}
        onClose={() => {
          setFeedbackPopup(null)
        }}
      >
        <Container maxWidth='md' sx={{ p: 2 }}>
          {feedbackPopup === 'valid'
            ? validEmailContent
            : feedbackPopup === 'invalid'
            ? invalidEmailContent
            : null}
        </Container>
      </Dialog>}
    </>
  )
}

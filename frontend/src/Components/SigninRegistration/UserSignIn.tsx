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
import { signIn } from 'next-auth/react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useState } from 'react'

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

const PopupOnSignin: React.FC<{
  open: boolean
  setClosed: () => void
}> = (props) => {
  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <Container maxWidth='md' sx={{ p: 2 }}>
        {props.children}
      </Container>
    </Dialog>
  )
}

export const UserSignIn: React.FC<SignInProps> = (props) => {
  const [feedbackPopup, setFeedbackPopup] = useState<
    'valid' | 'invalid' | null
  >(null)
  const [attemptedEmail, setAttemptedEmail] = useState<string | null>(null)

  const { register, handleSubmit } = useForm<SignInFormValues>()
  const onSubmit: SubmitHandler<SignInFormValues> = ({ email }) => {
    void signIn<'email'>(
      'email',
      { redirect: false, email: email },
      { signin_type: 'login' }
    ).then((response) => {
      if (typeof response !== 'undefined') {
        const { error, status, ok, url } = response
        console.log(error, status, ok, url)
        props.setClosed()
        setAttemptedEmail(email)
        if (error === 'AccessDenied') {
          setFeedbackPopup('invalid')
        } else {
          setFeedbackPopup('valid')
        }
      } else {
        // No connection to DB might get here
        console.log('Undefined response, some problem with auth...')
      }
    })
  }

  const invalidEmailContent = (email: string) => (
    <Typography>
      The email you gave,{' '}
      <Box component='span' fontWeight={500}>
        {email}
      </Box>
      , was not found.
    </Typography>
  )

  const validEmailContent = (email: string) => (
    <Typography>
      An email has been sent to{' '}
      <Box component='span' fontWeight={500}>
        {email}
      </Box>
      . Please use the link in that email to sign in.
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
      <PopupOnSignin
        open={feedbackPopup !== null}
        setClosed={() => {
          setFeedbackPopup(null)
        }}
      >
        {feedbackPopup === 'valid'
          ? validEmailContent(attemptedEmail!)
          : invalidEmailContent(attemptedEmail!)}
      </PopupOnSignin>
    </>
  )
}

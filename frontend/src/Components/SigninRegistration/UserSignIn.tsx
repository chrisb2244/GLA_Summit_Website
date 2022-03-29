import {
  Box,
  Button,
  Container,
  Dialog,
  Link,
  TextField,
  Typography,
  TypographyProps
} from '@mui/material'
import { signIn } from 'next-auth/react'
import { SubmitHandler, useForm } from 'react-hook-form'

type SignInProps = {
  open: boolean
  setClosed: () => void
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
      fontSize={'small'}
      align={'center'}
      {...typographyProps}
    >
      {children}
    </Typography>
  )
}

export const UserSignIn: React.FC<SignInProps> = (props) => {
  const { register, handleSubmit } = useForm<SignInFormValues>()
  const onSubmit: SubmitHandler<SignInFormValues> = ({ email }) => {
    signIn<'email'>('email', { redirect: false, email: email }).then(
      (response) => {
        if (typeof response !== 'undefined') {
          const { error, status, ok, url } = response
          console.log(error, status, ok, url)
          props.setClosed()
        } else {
          // No connection to DB might get here
          console.log('Undefined response, some problem with auth...')
        }
      }
    )
  }

  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Container maxWidth={'md'} sx={{ pb: 2 }}>
          <SmallCenteredText sx={{ p: 2 }}>
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
            ></TextField>
          </Box>
          <Button type='submit' variant='outlined' fullWidth>
            Log In
          </Button>
          <SmallCenteredText sx={{ pt: 2 }}>
            Not registered? <Link>Join Now</Link>
          </SmallCenteredText>
        </Container>
      </form>
    </Dialog>
  )
}

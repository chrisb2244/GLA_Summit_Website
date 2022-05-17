import { Dialog, Button, Typography, Box, Container, Link } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { useForm } from 'react-hook-form'
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form'
import type { ApiError } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { supabase } from '@/lib/supabaseClient'
import { FormField } from '@/Components/Form/FormField'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
}

type FormValues = {
  'First name': string
  'Last name': string
  Email: string
}

type NewUserInformation = {
  firstname: string
  lastname: string
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

export const NewUserRegistration: React.FC<UserRegistrationProps> = (props) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    mode: 'onBlur'
  })
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const newUserData: NewUserInformation = {
      firstname: data['First name'],
      lastname: data['Last name']
    }

    await supabase.auth
      .signUp(
        { email: data.Email, password: randomBytes(32).toString('hex') },
        { data: newUserData, redirectTo: 'http://localhost:3000' }
      )
      .then(({ user, session, error }) => {
        console.log({ user, session, error })
        if (error) return Promise.reject(error)
        // If reaching here, no error
        alert('Check your email for the login link!')
      })
      .catch((error: ApiError) => {
        alert(error.message)
      })
    props.setClosed()
    reset()
    return true
  }
  const onError: SubmitErrorHandler<FormValues> = (err) => console.log(err)

  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Container maxWidth='md' sx={{ p: 2 }}>
          <SmallCenteredText sx={{ pb: 2 }}>
            Please fill out the information below. You will receive an email
            with a verification link - click the link to automatically sign into
            the site.
          </SmallCenteredText>
          <Box mb={2}>
            <FormField
              control={control}
              name='First name'
              rules={{ required: true, maxLength: 80 }}
            />
          </Box>
          <Box mb={2}>
            <FormField
              control={control}
              name='Last name'
              rules={{ required: true, maxLength: 100 }}
            />
          </Box>
          <Box mb={2}>
            <FormField
              control={control}
              name='Email'
              rules={{ required: true, pattern: /^\S+@\S+$/i }}
            />
          </Box>
          <Button type='submit' variant='outlined' fullWidth>
            Register
          </Button>
          <SmallCenteredText sx={{ pt: 2 }}>
            Already registered?{' '}
            <Link
              onClick={(ev) => {
                ev.preventDefault()
                props.switchToSignIn()
              }}
              component='button'
            >
              Sign In
            </Link>
          </SmallCenteredText>
        </Container>
      </form>
    </Dialog>
  )
}

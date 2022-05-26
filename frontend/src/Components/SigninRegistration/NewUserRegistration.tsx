import { Dialog, Button, Typography, Container, Link } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { TypedFieldPath, useForm } from 'react-hook-form'
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form'
import type { ApiError } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { Person, PersonProps } from '../Form/Person'
import { myLog } from '@/lib/utils'
import { useSession } from '@/lib/sessionContext'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
}

export type NewUserInformation = {
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

function EMPTY<T>() {
  return '' as TypedFieldPath<T, T>
}

export const NewUserRegistration: React.FC<UserRegistrationProps> = (props) => {
  const { handleSubmit, reset, register, formState: {errors} } = useForm<PersonProps>({
    mode: 'onTouched'
  })
  const { signUp } = useSession()
  const onSubmit: SubmitHandler<PersonProps> = async (data) => {
    const newUserData: NewUserInformation = {
      firstname: data['firstName'],
      lastname: data['lastName']
    }

    signUp(
        { email: data.email, password: randomBytes(32).toString('hex') },
        { data: newUserData, redirectTo: window.location.href }
      )
      .then(({ user, session, error }) => {
        myLog({ user, session, error })
        if (error) return Promise.reject(error)
        // If reaching here, no error
        // console.log('Check your email for the login link!')
      })
      .catch((error: ApiError) => {
        myLog(error.message)
      })
    props.setClosed()
    reset()
    return true
  }
  const onError: SubmitErrorHandler<PersonProps> = (err) => myLog(err)

  return (
    <Dialog open={props.open} onClose={props.setClosed}>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <Container maxWidth='md' sx={{ p: 2 }}>
          <SmallCenteredText sx={{ pb: 2 }}>
            Please fill out the information below. You will receive an email
            with a verification link - click the link to automatically sign into
            the site.
          </SmallCenteredText>
          <Person<PersonProps>
            register={register}
            path={EMPTY()}
            errors={errors}
            splitSize={null}
            sx={{ pb: 2 }}
          />
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

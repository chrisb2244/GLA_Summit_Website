import { Dialog, Button, Typography, Container, Link, Box } from '@mui/material'
import type { TypographyProps } from '@mui/material'
import { TypedFieldPath, useForm } from 'react-hook-form'
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form'
import type { ApiError, UserCredentials } from '@/lib/sessionContext'
import { randomBytes } from 'crypto'
import { Person, PersonProps } from '../Form/Person'
import { myLog } from '@/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { NotificationDialogPopup } from '../NotificationDialogPopup'
import type { SignUpOptions, SignUpReturn } from '@/lib/sessionContext'
import { WaitingIndicator } from '../WaitingIndicator'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
  signUp: SignUpFunction
}

export type SignUpFunction = (
  credentials: UserCredentials,
  options?: SignUpOptions | undefined
) => Promise<SignUpReturn>

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

export const NewUserRegistration: React.FC<UserRegistrationProps> = ({
  signUp,
  setClosed,
  ...props
}) => {
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors }
  } = useForm<PersonProps>({
    mode: 'onTouched'
  })
  const [isWaiting, setIsWaiting] = useState(false)
  const [popupEmail, setPopupOpen] = useState<string | null>(null)

  // State and useEffect are required to get the setIsWaiting call to work before the signin.
  const [formData, setFormData] = useState<PersonProps | null>(null)
  const signupCallback = useCallback(
    (data: PersonProps) => {
      const newUserData: NewUserInformation = {
        firstname: data['firstName'],
        lastname: data['lastName']
      }

      const redirectTo = new URL(window.location.href).origin + '/'
      signUp(
        { email: data.email, password: randomBytes(32).toString('hex') },
        { data: newUserData, redirectTo }
      )
        .then(({ user, session, error }) => {
          myLog({ user, session, error })
          if (error) throw error
          // If reaching here, no error
          // console.log('Check your email for the login link!')
          setIsWaiting(false)
          setPopupOpen(data.email)
        })
        .catch((error: ApiError) => {
          myLog(error.message)
          setIsWaiting(false)
        })
      setClosed()
      reset()
      setFormData(null)
    },
    [signUp, setClosed, reset]
  )

  useEffect(() => {
    if (formData == null) {
      return
    }
    setIsWaiting(true)
    signupCallback(formData)
  }, [formData, signupCallback])

  const onSubmit: SubmitHandler<PersonProps> = async (data) => {
    setFormData(data)
  }

  const onError: SubmitErrorHandler<PersonProps> = (err) => myLog(err)
  const BoldEmail = (props: { email: string | null }) => {
    return (
      <Box component='span' fontWeight={500}>
        {props.email}
      </Box>
    )
  }

  return (
    <>
      <Dialog open={props.open} onClose={setClosed}>
        <form onSubmit={handleSubmit(onSubmit, onError)}>
          <Container maxWidth='md' sx={{ p: 2 }}>
            <SmallCenteredText sx={{ pb: 2 }}>
              Please fill out the information below. You will receive an email
              with a verification link - click the link to automatically sign
              into the site.
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
      <NotificationDialogPopup
        open={popupEmail !== null}
        onClose={() => setPopupOpen(null)}
      >
        <Typography>
          Thank you for registering for the GLA Summit 2022 website. Please
          check your email at <BoldEmail email={popupEmail} /> to verify your
          account.
        </Typography>
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

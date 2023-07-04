import { Button } from '@mui/material'
import { Dialog } from '@headlessui/react'
import { TypedFieldPath, useForm } from 'react-hook-form'
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form'
import type { ApiError, UserCredentials } from '@/lib/sessionContext'
import { randomBytes } from 'crypto'
import { Person, PersonProps } from '../Form/Person'
import { myLog } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { NotificationDialogPopup } from '../NotificationDialogPopup'
import type { SignUpOptions, SignUpReturn } from '@/lib/sessionContext'
import NextLink from 'next/link'
import { SmallCenteredText } from '@/Components/Utilities/SmallCenteredText'
import { LinkLikeText } from '../Utilities/LinkLikeText'
import { signUp } from './SignInUpActions'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
  waitingSpinner: JSX.Element
}

export type SignUpFunction = (
  credentials: UserCredentials,
  options?: SignUpOptions | undefined
) => Promise<SignUpReturn>

export type NewUserInformation = {
  firstname: string
  lastname: string
}

function EMPTY<T>() {
  return '' as TypedFieldPath<T, T>
}

export const NewUserRegistration: React.FC<
  React.PropsWithChildren<UserRegistrationProps>
> = ({ open, setClosed, waitingSpinner, ...props }) => {
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

  const signupCallback = useCallback(
    (data: PersonProps) => {
      const newUserData: NewUserInformation = {
        firstname: data['firstName'],
        lastname: data['lastName']
      }

      const redirectTo = new URL(window.location.href).origin + '/'
      signUp(data.email, newUserData, redirectTo)
        // .then(({ user, session, error }) => {
        .then((success) => {
          // myLog({ user, session, error })
          if (!success) {
            console.log("Failed to sign up")
            setIsWaiting(false)
          } else {
            setIsWaiting(false)
            setPopupOpen(data.email)
          }
        })
      setClosed()
      reset()
    },
    [signUp, setClosed, reset]
  )

  const onSubmit: SubmitHandler<PersonProps> = async (data) => {
    setIsWaiting(true)
    signupCallback(data)
  }

  const onError: SubmitErrorHandler<PersonProps> = (err) => myLog(err)

  return (
    <>
      <Dialog
        as='div'
        className='relative z-[100]'
        open={open}
        onClose={() => {
          setClosed()
          reset({ firstName: '', lastName: '', email: '' })
        }}
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div className='fixed inset-0 bg-black/30' aria-hidden='true' />

        {/* Full-screen container to center the panel */}
        <div className='fixed inset-0 flex items-center justify-center p-4'>
          <Dialog.Panel className='bg-white p-4 rounded max-w-xl' id='registerDialog'>
            <SmallCenteredText sx={{ pb: 2 }}>
              Already registered?{' '}
              <LinkLikeText
                onClick={(ev) => {
                  ev.preventDefault()
                  props.switchToSignIn()
                }}
              >
                Sign In
              </LinkLikeText>
            </SmallCenteredText>
            <SmallCenteredText sx={{ pb: 1 }}>
              Please fill out the information below. You will receive an email
              with a verification link - click the link to automatically sign
              into the site.
            </SmallCenteredText>
            <div className='bg-red-600 text-white rounded my-2 pt-2'>
              <SmallCenteredText sx={{ pb: 1 }}>
                In order to attend the conference, the required registration can
                be found at{' '}
                {
                  <a
                    href={'https://hopin.com/events/gla-summit-2022'}
                    className='underline'
                  >
                    https://hopin.com/events/gla-summit-2022
                  </a>
                }
              </SmallCenteredText>
            </div>
            <SmallCenteredText sx={{ pb: 2 }}>
              This site is currently mostly focused on presentation submission,
              although last year&apos;s presentations can be found at{' '}
              {
                <NextLink href={'/presentations'}>
                  <span className='underline cursor-pointer'>
                    https://glasummit.org/presentations
                  </span>
                </NextLink>
              }
              .
            </SmallCenteredText>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <Person<PersonProps>
                register={register}
                path={EMPTY()}
                errors={errors}
                splitSize={null}
                sx={{ pb: 2 }}
              />
              {/* TODO: Text colour used here as a blue, also border colour */}
              <button type='submit' className='w-full border rounded border-blue-300 uppercase px-4 py-1 text-blue-500'>
                Register
              </button>
              {/* <Button type='submit' variant='outlined' fullWidth>
                Register
              </Button> */}
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
      <NotificationDialogPopup
        open={popupEmail !== null}
        onClose={() => setPopupOpen(null)}
      >
        <p>
          Thank you for registering for the GLA Summit 2022 website. Please
          check your email at <b>{popupEmail}</b> to verify your account.
        </p>
      </NotificationDialogPopup>
      {isWaiting ? waitingSpinner : null}
    </>
  )
}

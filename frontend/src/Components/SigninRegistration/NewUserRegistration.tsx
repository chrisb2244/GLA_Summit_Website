import { TypedFieldPath, useForm } from 'react-hook-form'
import type { SubmitHandler, SubmitErrorHandler } from 'react-hook-form'
import { Person, PersonProps } from '../Form/Person'
import { myLog } from '@/lib/utils'
import NextLink from 'next/link'
import { CenteredDialog } from '../Layout/CenteredDialog'

type UserRegistrationProps = {
  open: boolean
  setClosed: () => void
  switchToSignIn: () => void
  onSubmit: SubmitHandler<PersonProps>
}

export type NewUserInformation = {
  firstname: string
  lastname: string
}

function EMPTY<T>() {
  return '' as TypedFieldPath<T, T>
}

export const NewUserRegistration: React.FC<
  React.PropsWithChildren<UserRegistrationProps>
> = ({ open, setClosed, ...props }) => {
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors }
  } = useForm<PersonProps>({
    mode: 'onTouched'
  })

  const onError: SubmitErrorHandler<PersonProps> = (err) => myLog(err)

  return (
      <CenteredDialog
        open={open}
        onClose={() => {
          setClosed()
          reset({ firstName: '', lastName: '', email: '' })
        }}
        dialogId='registerDialog'
      >
        <div className='flex flex-col space-y-2 px-2 text-sm items-center text-center pb-4'>
          <p>
            {'Already registered?\u00A0'}
            <a
              className='link'
              onClick={(ev) => {
                ev.preventDefault()
                props.switchToSignIn()
              }}
            >
              Sign In
            </a>
          </p>
          <p>
            Please fill out the information below. You will receive an email
            with a verification link - click the link to automatically sign into
            the site.
          </p>
          <div className='bg-red-600 text-white rounded my-2 py-2'>
            <p>
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
            </p>
          </div>
          <p>
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
          </p>
        </div>
        <form onSubmit={handleSubmit(props.onSubmit, onError)}>
          <Person<PersonProps>
            register={register}
            path={EMPTY()}
            errors={errors}
            splitSize={null}
            sx={{ pb: 2 }}
          />
          {/* TODO: Text colour used here as a blue, also border colour */}
          <button
            type='submit'
            className='w-full border rounded border-blue-300 uppercase px-4 py-1 text-blue-500'
          >
            Register
          </button>
          {/* <Button type='submit' variant='outlined' fullWidth>
                Register
              </Button> */}
        </form>
      </CenteredDialog>

  )
}

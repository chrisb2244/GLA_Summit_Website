import type { SubmitHandler } from 'react-hook-form'
import { PersonProps } from '../Form/Person'
import NextLink from 'next/link'
import { CenteredDialog } from '../Layout/CenteredDialog'
import { SignUpForm } from '../Forms/SignUpForm'

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

export const NewUserRegistration: React.FC<
  React.PropsWithChildren<UserRegistrationProps>
> = ({ open, setClosed, ...props }) => {
  return (
    <CenteredDialog
      open={open}
      onClose={() => {
        setClosed()
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
          Please fill out the information below. You will receive an email with
          a verification link - click the link to automatically sign into the
          site.
        </p>
        <div className='bg-red-600 text-white rounded my-2 py-2'>
          <p>
            In order to attend the conference, the required registration can be
            found at{' '}
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
            <NextLink href={'/presentation-list'}>
              <span className='underline cursor-pointer'>
                https://glasummit.org/presentations
              </span>
            </NextLink>
          }
          .
        </p>
      </div>
      <SignUpForm onSubmit={props.onSubmit} />
    </CenteredDialog>
  )
}

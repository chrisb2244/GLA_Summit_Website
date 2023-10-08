'use client'
import { useState } from 'react'
import { RegistrationPopup } from './RegistrationPopup'
import { useRouter } from 'next/navigation'

type SignInUpButtonProps = {
  waitingSpinner: JSX.Element
  onSignInComplete?: () => void
}

export const SignInUpButton: React.FC<SignInUpButtonProps> = (
  props
) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { waitingSpinner, onSignInComplete } = props

  return (
    <>
      <button
        className='flex h-full px-2 hover:bg-secondaryc'
        color='warning' // TODO: warning isn't a colour
        onClick={() => {
          setDialogOpen(true)
        }}
      >
        <span className='text-[18px] line-height-[28px] p-2'>
          Sign In / Register
        </span>
      </button>
      <RegistrationPopup
        open={dialogOpen}
        setClosed={() => {
          console.log('closed dialog')
          setDialogOpen(false)
        }}
        onSignInComplete={onSignInComplete}
        waitingSpinner={waitingSpinner}
      />
    </>
  )
}

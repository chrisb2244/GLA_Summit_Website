'use client'
import { useState } from 'react'
import { RegistrationPopup } from './RegistrationPopup'

export const SignInUpButton: React.FC<{ waitingSpinner: JSX.Element }> = (
  props
) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { waitingSpinner } = props

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
        setClosed={() => setDialogOpen(false)}
        waitingSpinner={waitingSpinner}
      />
    </>
  )
}

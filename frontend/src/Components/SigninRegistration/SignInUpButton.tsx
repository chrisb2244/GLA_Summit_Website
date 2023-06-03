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
        className='px-2 py-[6px]'
        color='warning'
        onClick={() => {
          setDialogOpen(true)
        }}
      >
        Sign In / Register
      </button>
      <RegistrationPopup
        open={dialogOpen}
        setClosed={() => setDialogOpen(false)}
        waitingSpinner={waitingSpinner}
      />
    </>
  )
}

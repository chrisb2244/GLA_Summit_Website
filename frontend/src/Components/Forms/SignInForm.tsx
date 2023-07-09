'use client'

import { myLog } from '@/lib/utils'
import { Button } from '../Form/Button'
import { FormField } from '../Form'
import { useForm } from 'react-hook-form'
import React from 'react'
import { signIn } from '../SigninRegistration/SignInUpActions'

export type SignInFormValues = {
  email: string
}

export const SignInForm = () => {
  const onSubmit = (data: SignInFormValues) => {
    signIn(data.email).then((success) => {
      console.log(success)
    })
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormValues>({
    mode: 'onTouched'
  })

  return (
    <form onSubmit={handleSubmit(onSubmit, (e) => myLog(e))} className='flex flex-col'>
        <FormField
          label='Email'
          type='email'
          placeholder='my.email@glasummit.org'
          registerReturn={register('email', {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+\.\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fieldError={errors.email}
        />
      <Button type='submit'>
        Log In
      </Button>
    </form>
  )
}

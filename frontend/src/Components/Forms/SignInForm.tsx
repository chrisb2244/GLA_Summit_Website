'use client'

import { myLog } from '@/lib/utils'
import { Button } from '@mui/material'

import { FormField } from '../Form'
import { useForm } from 'react-hook-form'
import React from 'react'

export type SignInFormValues = {
  email: string
}

type SignInFormProps = {}

export const SignInForm: React.FC<SignInFormProps> = (props) => {
  const onSubmit = (data: SignInFormValues) => {
    console.log(data)
  }
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormValues>({
    mode: 'onTouched'
  })

  const emailErrorProps = () => {
    const error = errors.email
    const isError = !!errors.email
    return {
      error: isError,
      helperText: error?.message,
      FormHelperTextProps: { role: isError ? ' alert' : undefined }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}>
        <FormField
          fullWidth
          label='Email'
          type='email'
          placeholder='dummy.email@glasummit.org'
          // autoComplete='email'
          registerReturn={register('email', {
            required: 'Required',
            pattern: {
              value: /^\S+@\S+$/i,
              message: "This email doesn't match the expected pattern"
            }
          })}
          fieldError={errors.email}
        />
      <Button type='submit' variant='outlined' fullWidth>
        Log In
      </Button>
    </form>
  )
}

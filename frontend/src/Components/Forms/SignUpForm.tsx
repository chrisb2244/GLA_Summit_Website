'use client'

import { myLog } from '@/lib/utils'
import { Button } from '../Form/Button'
import { Person, PersonProps } from '../Form'
import { SubmitHandler, TypedFieldPath, useForm } from 'react-hook-form'
import React from 'react'

type SignUpFormProps = {
  onSubmit: SubmitHandler<PersonProps>
}

function EMPTY<T>() {
  return '' as TypedFieldPath<T, T>
}

export const SignUpForm = (props: SignUpFormProps) => {
  const { onSubmit } = props

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PersonProps>({
    mode: 'onSubmit'
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}
      className='flex flex-col'
    >
      <Person<PersonProps>
        register={register}
        path={EMPTY()}
        errors={errors}
        splitSize={null}
        sx={{ pb: 2 }}
      />
      <Button type='submit'>Register</Button>
    </form>
  )
}

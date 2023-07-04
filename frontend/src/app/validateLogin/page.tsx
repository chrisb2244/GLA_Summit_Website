'use client'

import { verifyLogin } from '@/Components/SigninRegistration/SignInUpActions'
import { useForm } from 'react-hook-form'

type ValidationFormData = {
  email: string
  verificationCode: string
}

const ValidateLogin = () => {
  const onSubmit = (data: ValidationFormData) => {
    console.log(data)
    verifyLogin(data)
  }

  const { register, handleSubmit } = useForm<ValidationFormData>()

  return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('email')} />
    <input {...register('verificationCode')} className='border border-black' />
    <button type='submit'>Submit</button>
  </form>
  )
}

export default ValidateLogin
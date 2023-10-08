'use client';

import { myLog } from '@/lib/utils';
import { Button } from '../Form/Button';
import { FormField } from '../Form';
import { SubmitHandler, useForm } from 'react-hook-form';
import React from 'react';

export type SignInFormValues = {
  email: string;
};

type SignInFormProps = {
  onSubmit: SubmitHandler<SignInFormValues>;
};

export const SignInForm = (props: SignInFormProps) => {
  const { onSubmit } = props;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormValues>({
    mode: 'onSubmit'
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}
      className='flex flex-col'
    >
      <FormField
        label='Email'
        type='email'
        autoComplete='email'
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
      <Button type='submit'>Log In</Button>
    </form>
  );
};

'use client';

import { myLog } from '@/lib/utils';
import { Button } from '../Form/Button';
import { Person, PersonProps } from '../Form/Person';
import { SubmitHandler, useForm } from 'react-hook-form';
import React from 'react';

type SignUpFormProps = {
  onSubmit: SubmitHandler<PersonProps>;
};

export const SignUpForm = (props: SignUpFormProps) => {
  const { onSubmit } = props;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PersonProps>({
    mode: 'onSubmit'
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (e) => myLog(e))}
      className='flex flex-col'
    >
      <div className='pb-4'>
        <Person<PersonProps>
          register={register}
          errors={errors}
          splitSize={'md'}
        />
      </div>
      <Button type='submit'>Register</Button>
    </form>
  );
};

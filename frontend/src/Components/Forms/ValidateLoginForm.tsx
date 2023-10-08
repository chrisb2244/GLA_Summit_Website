'use client';

import { verifyLogin } from '@/Components/SigninRegistration/SignInUpActions';
import { useForm } from 'react-hook-form';
import { FormField } from '../Form/FormField';
import { Button } from '../Form/Button';

type ValidateLoginFormProps = {
  email?: string;
  showEmail?: boolean;
  onSubmitFn?: () => void;
};

type ValidationFormData = {
  email: string;
  verificationCode: string;
};

export const ValidateLoginForm = (props: ValidateLoginFormProps) => {
  const hideEmail = typeof props.email !== 'undefined' && !props.showEmail;

  const onSubmit = async (data: ValidationFormData) => {
    await verifyLogin(data);
    props.onSubmitFn?.();
  };

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ValidationFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col '>
      <FormField
        registerReturn={register('email')}
        fieldError={errors.email}
        label='Email'
        hidden={hideEmail}
        value={props.email}
        readOnly={typeof props.email !== 'undefined'}
        autoComplete='email'
      />
      <FormField
        registerReturn={register('verificationCode')}
        fieldError={errors.verificationCode}
        type='text'
        required
        label='Verification Code'
      />
      <Button type='submit'>Submit</Button>
    </form>
  );
};

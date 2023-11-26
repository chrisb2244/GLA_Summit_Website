import { Button } from '@/Components/Form/Button';
import { FormField } from '@/Components/Form/FormFieldSrv';
import { verifyLoginWithRedirectFromForm } from '@/Components/SigninRegistration/SignInUpActions';

type VerifyFormProps = {
  email?: string;
  redirectTo?: string;
};

export const VerifyForm = (props: VerifyFormProps) => {
  const { email } = props;
  const hideEmail = typeof email !== 'undefined';
  return (
    <div className='mx-auto flex max-w-lg flex-col py-4'>
      <form action={verifyLoginWithRedirectFromForm}>
        <input
          type='hidden'
          name='redirectTo'
          value={props.redirectTo ?? '/'}
        />
        <FormField
          name='email'
          label='Email'
          hidden={hideEmail}
          value={email}
          readOnly={hideEmail}
          autoComplete='email'
          fullWidth
        />
        <FormField
          name='verificationCode'
          type='text'
          required
          label='Verification Code'
          fullWidth
        />
        <Button type='submit' fullWidth>
          Submit
        </Button>
      </form>
    </div>
  );
};

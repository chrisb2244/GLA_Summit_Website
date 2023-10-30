import { ValidateLoginForm } from '../Forms/ValidateLoginForm';

type ValidationCodePopupProps = {
  onSubmit: () => void;
  email?: string;
};

export const ValidationCodePopup = (props: ValidationCodePopupProps) => {
  const { onSubmit, email } = props;

  return (
    <>
      <p className='prose text-center'>
        An email has been sent to <span className='font-bold'>{email}</span>.
        Please copy the code from that email into the boxes below to sign in.
      </p>
      <ValidateLoginForm email={email} onSubmitFn={onSubmit} />
    </>
  );
};

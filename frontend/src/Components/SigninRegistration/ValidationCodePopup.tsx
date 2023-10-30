import { Typography } from '@mui/material';
import { ValidateLoginForm } from '../Forms/ValidateLoginForm';

type ValidationCodePopupProps = {
  onSubmit: () => void;
  email?: string;
};

export const ValidationCodePopup: React.FC<ValidationCodePopupProps> = (
  props
) => {
  const { onSubmit, email } = props;

  return (
    <>
      <Typography>
        An email has been sent to <b>{email}</b>. Please copy the code from that
        email into the boxes below to sign in.
      </Typography>
      <ValidateLoginForm email={email} onSubmitFn={onSubmit} />
    </>
  );
};

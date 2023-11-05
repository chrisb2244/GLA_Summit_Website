import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './Button';

type SubmitButtonProps = {
  staticText: string;
  pendingText: string;
};

export const SubmitButton = (props: SubmitButtonProps & ButtonProps) => {
  const { staticText, pendingText, ...buttonProps } = props;
  const { pending } = useFormStatus();
  return (
    <Button type='submit' fullWidth disabled={pending} {...buttonProps}>
      {pending ? pendingText : staticText}
    </Button>
  );
};

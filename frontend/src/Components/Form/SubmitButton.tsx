'use client';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from './Button';
import { forwardRef } from 'react';

type SubmitButtonProps = {
  staticText: string;
  pendingText: string;
};

export const SubmitButton = forwardRef<
  HTMLButtonElement,
  SubmitButtonProps & ButtonProps
>((props: SubmitButtonProps & ButtonProps, ref) => {
  const { staticText, pendingText, ...buttonProps } = props;
  const { pending } = useFormStatus();
  return (
    <Button
      type='submit'
      fullWidth
      disabled={pending}
      {...buttonProps}
      ref={ref}
    >
      {pending ? pendingText : staticText}
    </Button>
  );
});
SubmitButton.displayName = 'SubmitButton';

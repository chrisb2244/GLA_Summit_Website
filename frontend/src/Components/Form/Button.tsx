import { VariantProps, cva } from 'class-variance-authority';
import React, {
  PropsWithChildren,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  forwardRef
} from 'react';

const buttonStyles = cva(
  'p-2 border bg-gray-200 border-gray-400 focus:border-secondaryc focus:border-2 text-base text-center shadow-md focus-within:outline-hidden',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      // Set the enabled text colour explicitly via the `foreground` token so the
      // button never inherits ambient colour: e.g. the purple from a
      // prose-wrapping link leaks in via Preflight's `color: inherit` on form
      // controls. Gated through the variant so exactly one text-colour utility is
      // ever emitted (no cascade-order tie between base and disabled).
      disabled: {
        true: 'text-gray-400',
        false: 'text-foreground',
        undefined: 'text-foreground'
      }
    }
  }
);

type VariantStyleProps = VariantProps<typeof buttonStyles>;
export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'formAction'
> &
  VariantStyleProps & {
    formAction?:
      | string
      | ((formData: FormData) => void | Promise<void>);
  };

export const Button = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps>
>((props: PropsWithChildren<ButtonProps>, ref) => {
  const { children, fullWidth, disabled, ...buttonProps } = props;
  return (
    <button
      {...buttonProps}
      disabled={disabled}
      className={buttonStyles({ fullWidth, disabled })}
      ref={ref}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'hidden'
> &
  VariantStyleProps & { id: string };

export const FileButton: React.FC<PropsWithChildren<InputProps>> = (props) => {
  const { children, fullWidth, ...inputProps } = props;
  const id = inputProps.id;

  return (
    <label htmlFor={id} role='button' className={buttonStyles({ fullWidth })}>
      {children}
      <input type='file' {...inputProps} className='hidden' />
    </label>
  );
};

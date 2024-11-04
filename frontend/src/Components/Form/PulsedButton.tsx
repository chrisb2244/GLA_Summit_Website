'use client';
import { VariantProps, cva } from 'class-variance-authority';
import React, {
  PropsWithChildren,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  forwardRef,
  startTransition
} from 'react';

const buttonStyles = cva(
  'p-2 border bg-gray-200 border-gray-400 focus:border-secondaryc focus:border-2 text-base text-center shadow-md focus-within:outline-none',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      disabled: {
        true: 'text-gray-400'
      }
    }
  }
);

type VariantStyleProps = VariantProps<typeof buttonStyles>;
export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className'
> &
  VariantStyleProps;

export const PulsedButton = forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps>
>((props: PropsWithChildren<ButtonProps>, ref) => {
  const { children, fullWidth, disabled, ...buttonProps } = props;
  return (
    <button
      {...buttonProps}
      disabled={disabled}
      className={buttonStyles({ fullWidth, disabled })}
      onClick={(ev) => {
        startTransition(() => {
          const button = ev.currentTarget;
          button.classList.add('animate-clickbounce');
          setTimeout(() => {
            button.classList.remove('animate-clickbounce');
          }, 200);
        });
      }}
      ref={ref}
    >
      {children}
    </button>
  );
});
PulsedButton.displayName = 'PulsedButton';

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'hidden'
> &
  VariantStyleProps & { id: string };

export const PulsedFileButton: React.FC<PropsWithChildren<InputProps>> = (
  props
) => {
  const { children, fullWidth, ...inputProps } = props;
  const id = inputProps.id;

  return (
    <label
      htmlFor={id}
      role='button'
      className={buttonStyles({ fullWidth })}
      onClick={(ev) => {
        const button = ev.currentTarget;
        button.classList.add('animate-pulse');
        setTimeout(() => {
          button.classList.remove('animate-pulse');
        }, 500);
      }}
    >
      {children}
      <input type='file' {...inputProps} className='hidden' />
    </label>
  );
};

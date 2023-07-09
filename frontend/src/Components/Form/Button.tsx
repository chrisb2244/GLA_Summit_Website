import { VariantProps, cva } from 'class-variance-authority'
import { PropsWithChildren, ButtonHTMLAttributes } from 'react'

const buttonStyles = cva(
  'p-2 border bg-gray-200 border-gray-400 focus:border-secondaryc focus:border-2 text-base shadow-md focus-within:outline-none',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      }
    }
  }
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>

export const Button: React.FC<PropsWithChildren<ButtonProps>> = (props) => {
  const { children, fullWidth, ...buttonProps } = props
  return (
    <button {...buttonProps} className={buttonStyles({ fullWidth })}>
      {children}
    </button>
  )
}

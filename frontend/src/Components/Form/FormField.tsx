import { type FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { type VariantProps, cva } from 'class-variance-authority'
import type { HTMLInputTypeAttribute } from 'react'

const inputFieldStyles = cva(
  'px-4 py-2 peer placeholder-transparent border-b-2 border-b-gray-400 focus:border-b-violet-600 focus-visible:outline-none text-lg',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      }
    }
  }
)

type FormFieldProps = {
  registerReturn: UseFormRegisterReturn
  fieldError: FieldError | undefined
  label: string
  type: HTMLInputTypeAttribute
  placeholder?: string
} & VariantProps<typeof inputFieldStyles>

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { registerReturn, fieldError, fullWidth } = props
  const isError = typeof fieldError !== 'undefined'
  const id = registerReturn.name

  // placeholder-shown implies the field is empty
  // focus should have the non-empty classNames

  // IMPORTANT:
  // The peer selectors require that the input is before the label in the DOM.
  const labelAlways = 'absolute block z-[1] transition-all'
  const labelRaised = ['text-gray-700', 'text-sm', '-top-2', 'left-2']
    .map((c) => `${c} peer-focus:${c}`)
    .join(' ')
  const labelPlaceholder = ['text-gray-500', 'text-base', 'top-4', 'left-4']
    .map((c) => `peer-placeholder-shown:${c}`)
    .join(' ')

  return (
    <div
      className={`inline-flex flex-col relative align-top mt-2 mb-4 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <input
        id={id}
        type={props.type}
        autoComplete='email'
        className={inputFieldStyles({ fullWidth })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
      />
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${isError ? 'text-red-700' : ''} ${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label}
      </label>
    </div>
  )
}

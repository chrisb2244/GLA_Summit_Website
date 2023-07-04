import { type FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { type VariantProps, cva } from 'class-variance-authority'
import type { HTMLInputTypeAttribute } from 'react'

const inputFieldStyles = cva(
  'px-4 pt-3 pb-1 peer placeholder-transparent border border-b-4 border-b-gray-400 focus:border-b-secondaryc focus-visible:outline-none text-lg',
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
  type?: HTMLInputTypeAttribute
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
  const labelRaised = [
    'text-gray-700',
    'text-sm',
    '-top-2',
    'left-2',
    'bg-white',
    'peer-focus:text-gray-700',
    'peer-focus:text-sm',
    'peer-focus:-top-2',
    'peer-focus:left-2',
    'peer-focus:bg-white'
  ].join(' ')
  const labelPlaceholder = [
    'peer-placeholder-shown:text-gray-500',
    'peer-placeholder-shown:text-base',
    'peer-placeholder-shown:top-4',
    'peer-placeholder-shown:left-4'
  ].join(' ')

  // Define separately for use styling the label and the error message
  const errorTextClassNames = 'text-red-700'

  const errorMessage = isError ? (
    <span className={errorTextClassNames} role='alert'>
      {fieldError.message}
    </span>
  ) : null

  return (
    <div
      className={`inline-flex flex-col relative align-top mt-2 mb-4 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      <input
        id={id}
        type={props.type ?? 'text'}
        autoComplete='email'
        className={inputFieldStyles({ fullWidth })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
      />
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${
          isError ? errorTextClassNames : ''
        } ${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label}
      </label>
      {errorMessage}
    </div>
  )
}

import { type FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { type VariantProps, cva } from 'class-variance-authority'
import type { HTMLInputTypeAttribute, HTMLProps } from 'react'

const inputFieldStyles = cva(
  'px-4 pt-3 pb-1 peer placeholder-transparent border focus-visible:outline-none text-lg',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      readOnly: {
        true: 'bg-gray-200',
        false: 'border-b-4 border-b-gray-400 focus:border-b-secondaryc'
      }
    }
  }
)

type FormFieldProps = {
  registerReturn: UseFormRegisterReturn
  fieldError: FieldError | undefined
  type?: HTMLInputTypeAttribute
  placeholder?: string
  hidden?: boolean
} & VariantProps<typeof inputFieldStyles> & Omit<HTMLProps<HTMLInputElement>, 'type'>

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { registerReturn, fieldError, fullWidth, ...inputProps } = props
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
    'bg-inherit',
    'peer-focus:text-gray-700',
    'peer-focus:text-sm',
    'peer-focus:-top-2',
    'peer-focus:left-2',
    'peer-focus:bg-inherit'
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
      } ${props.hidden ? 'hidden' : ''}`}
    >
      <input
        id={id}
        type={props.type ?? 'text'}
        autoComplete='email'
        className={inputFieldStyles({ fullWidth, readOnly: inputProps.readOnly ?? false })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
        {...inputProps}
      />
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${
          isError ? errorTextClassNames : ''
        } ${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label ?? id}
      </label>
      {errorMessage}
    </div>
  )
}

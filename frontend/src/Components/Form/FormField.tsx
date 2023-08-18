import { type FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { type VariantProps, cva } from 'class-variance-authority'
import type { HTMLInputTypeAttribute, HTMLProps } from 'react'
import React from 'react'

const inputFieldStyles = cva(
  'px-4 pt-3 pb-1 peer placeholder-transparent border focus-visible:outline-none border-t-0 focus:border-t-0 placeholder-shown:border-t text-lg border-gray-400 box-border',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      readOnly: {
        true: 'text-gray-500',
        false: 'border-b-4 focus:border-b-secondaryc'
      }
    }
  }
)

const wrapperStyles = cva(
  'inline-flex flex-col relative align-top mt-2 mb-4 bg-inherit overflow-x-clip',
  {
    variants: {
      fullWidth: {
        true: 'w-full'
      },
      hidden: {
        true: 'hidden'
      }
    }
  }
)

type VariantPropTypes = VariantProps<typeof inputFieldStyles>

type FormProps = {
  registerReturn: UseFormRegisterReturn
  fieldError: FieldError | undefined
  type?: HTMLInputTypeAttribute
  placeholder?: string
  hidden?: boolean
}

type FormFieldProps = FormProps &
  VariantPropTypes &
  Omit<HTMLProps<HTMLInputElement>, 'type'>

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { registerReturn, fieldError, fullWidth, ...inputProps } = props
  const isError = typeof fieldError !== 'undefined'
  const id = registerReturn.name

  // placeholder-shown implies the field is empty
  // focus should have the non-empty classNames

  // IMPORTANT:
  // The peer selectors require that the input is before the label in the DOM.
  return (
    <div className={wrapperStyles({ fullWidth, hidden: props.hidden })}>
      <input
        id={id}
        type={props.type ?? 'text'}
        className={inputFieldStyles({
          fullWidth,
          readOnly: inputProps.readOnly ?? false
        })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
        {...inputProps}
      />
      {topBorderElement}
      {/* <div className='bg-inherit absolute h-2 -top-2 w-24 left-2 ' aria-hidden></div>
      <div className='bg-white absolute h-2 top-0 w-24 left-2 ' aria-hidden></div> */}
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${
          isError ? errorTextClassNames : ''
        } ${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label ?? id}
      </label>
      <ErrorMessage error={fieldError} />
    </div>
  )
}

type FormFieldIndicatorProps = VariantPropTypes & HTMLProps<HTMLInputElement>
export const FormFieldIndicator: React.FC<FormFieldIndicatorProps> = (
  props
) => {
  const { fullWidth, id, ...inputProps } = props

  return (
    <div className={wrapperStyles({ fullWidth, hidden: props.hidden })}>
      <input
        id={id}
        type={props.type ?? 'text'}
        className={inputFieldStyles({
          fullWidth,
          readOnly: true
        })}
        placeholder={props.placeholder ?? id}
        disabled
        {...inputProps}
      />
      {topBorderElement}
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label ?? id}
      </label>
    </div>
  )
}

type TextAreaProps = FormProps &
  VariantPropTypes &
  HTMLProps<HTMLTextAreaElement>

export const TextArea: React.FC<TextAreaProps> = (props) => {
  const { registerReturn, fieldError, fullWidth, ...inputProps } = props
  const isError = typeof fieldError !== 'undefined'
  const id = registerReturn.name

  return (
    <div className={wrapperStyles({ fullWidth, hidden: props.hidden })}>
      <textarea
        id={id}
        className={inputFieldStyles({
          fullWidth,
          readOnly: inputProps.readOnly ?? false
        })}
        placeholder={props.placeholder ?? id}
        {...registerReturn}
        {...inputProps}
      />
      {topBorderElement}
      <label
        id={`${id}-label`}
        htmlFor={id}
        className={`${
          isError ? errorTextClassNames : ''
        } ${labelAlways} ${labelRaised} ${labelPlaceholder}`}
      >
        {props.label ?? id}
      </label>
      <ErrorMessage error={fieldError} />
    </div>
  )
}

const ErrorMessage = ({ error }: { error: FieldError | undefined }) => {
  const isError = typeof error !== 'undefined'
  return isError ? (
    <span className={errorTextClassNames} role='alert'>
      {error.message}
    </span>
  ) : null
}

// IMPORTANT:
// The peer selectors require that the input is before the label in the DOM.
const labelAlways = 'absolute block z-[2] transition-all'
const labelRaised = [
  'text-gray-700',
  'text-sm',
  '-top-2',
  'left-2',
  'px-1',
  'peer-focus:text-gray-700',
  'peer-focus:text-sm',
  'peer-focus:-top-2',
  'peer-focus:left-2',
  'before:w-[105%] before:absolute before:flex before:top-2 before:-left-[2px] before:z-[-1] before:bg-white before:h-[1px]',
  'before:peer-focus:w-[105%] before:peer-focus:absolute before:peer-focus:flex before:peer-focus:top-2 before:peer-focus:-left-[2px] before:peer-focus:z-[-1] before:peer-focus:bg-white before:peer-focus:h-[1px]'
].join(' ')
const labelPlaceholder = [
  'peer-placeholder-shown:text-gray-500',
  'peer-placeholder-shown:text-base',
  'peer-placeholder-shown:top-4',
  'peer-placeholder-shown:left-4',
  'before:peer-placeholder-shown:hidden'
].join(' ')

// Define separately for use styling the label and the error message
const errorTextClassNames = 'text-red-700'

// Element to provide a top border when the label moves upwards
const topBorderElement = (
  <div
    className='absolute top-0 left-0 bg-gray-400 h-[1px] w-full peer-focus:absolute peer-focus:top-0 peer-focus:left-0 peer-focus:bg-gray-400 peer-focus:h-[1px] peer-focus:w-full peer-focus:block peer-placeholder-shown:bg-transparent'
    aria-hidden
  />
)

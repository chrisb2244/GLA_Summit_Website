import { TextField, TextFieldProps } from '@mui/material'
import { FieldError, UseFormRegisterReturn } from 'react-hook-form'

type FormFieldProps = {
  registerReturn: UseFormRegisterReturn
  fieldError: FieldError | undefined
} & TextFieldProps

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<FormFieldProps> = (props) => {
  const { registerReturn, fieldError: error, children, ...textFieldProps } = props
  const isError = typeof error !== 'undefined'
  return (
    <TextField
      {...registerReturn}
      {...textFieldProps}
      error={isError}
      helperText={error?.message}
      FormHelperTextProps={{ role: isError ? 'alert' : undefined }}
    />
  )
}

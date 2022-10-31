import { TextField, TextFieldProps } from '@mui/material'
import { FieldError, UseFormRegisterReturn } from 'react-hook-form'

type FormFieldProps = {
  registerReturn: UseFormRegisterReturn
  fieldError: FieldError | undefined
} & TextFieldProps

// This provides a wrapper for the TextField, providing the error behaviour.
export const FormField: React.FC<React.PropsWithChildren<FormFieldProps>> = (props) => {
  const { registerReturn, fieldError, children, ...textFieldProps } = props
  const isError = typeof fieldError !== 'undefined'
  return (
    <TextField
      {...registerReturn}
      {...textFieldProps}
      error={isError}
      helperText={fieldError?.message}
      FormHelperTextProps={{ role: isError ? 'alert' : undefined }}
    >
      {children}
    </TextField>
  )
}

import { useField, Field } from "formik";
import { TextField } from '@material-ui/core'

export function TextFieldWrapper(props: {
  name: string
  label: string
  type?: string
}) {
  const [field, meta] = useField(props.name);

  const configTextField = {
    error: false,
    helperText: '',
    name: props.name,
    id: props.name,
    label: props.label,
    type: props.type ?? "text",
    variant: "outlined" as const, // standard, filled, outlined, undefined
    fullWidth: true,
    onChange: field.onChange,
    onBlur: field.onBlur,
    value: field.value
  }

  if (meta && meta.touched && meta.error) {
    configTextField.error = true
    configTextField.helperText = meta.error
  }

  return (
      <TextField {...configTextField} />
  )
}
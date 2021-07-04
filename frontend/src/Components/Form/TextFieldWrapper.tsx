import { useField } from "formik";
import { TextField } from '@material-ui/core'

type TextFieldWrapperProps = {
  name: string
  label: string
  type?: string
  multiline?: boolean
}

export function TextFieldWrapper(props: TextFieldWrapperProps & {className?: string}) {
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
    value: field.value,
    multiline: props.multiline,
    className: props.className,
  }

  if (meta && meta.touched && meta.error) {
    configTextField.error = true
    configTextField.helperText = meta.error
  }

  return (
      <TextField {...configTextField} />
  )
}
import { useField } from 'formik'
import { TextField } from '@material-ui/core'

interface TextFieldWrapperProps {
  name: string
  label: string
  type?: string
  multiline?: boolean
}

export const TextFieldWrapper: React.FC<TextFieldWrapperProps & {className?: string}> = (props) => {
  const [field, meta] = useField(props.name)

  const configTextField = {
    error: false,
    helperText: '',
    name: props.name,
    id: props.name,
    label: props.label,
    type: props.type ?? 'text',
    variant: 'outlined' as const, // standard, filled, outlined, undefined
    fullWidth: true,
    onChange: field.onChange,
    onBlur: field.onBlur,
    value: field.value,
    multiline: props.multiline,
    className: props.className
  }

  if (meta.touched && typeof meta.error !== 'undefined') {
    configTextField.error = true
    configTextField.helperText = meta.error
  }

  return (
    <TextField {...configTextField} />
  )
}

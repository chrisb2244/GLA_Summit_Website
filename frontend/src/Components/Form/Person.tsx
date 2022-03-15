import { Grid } from '@mui/material'
import { Field, FieldProps } from 'formik'
import { TextFieldWrapper as TextField } from './TextFieldWrapper'

type PersonProps = {}

export type initialPersonValues = {
  firstName: string,
  lastName: string,
  email: string
}

export const Person: React.FC<PersonProps & FieldProps> = ({
  field,
  ...props
}) => {
  const prefix = field.name

  return (
    <Field as={'div'} name={prefix} {...props}>
      {/* <Grid item xs={12} md={6}> */}
        <TextField
          name={`${prefix}.firstName`}
          label='First Name'
        />
      {/* </Grid>
      <Grid item xs={12} md={6}> */}
        <TextField
          name={`${prefix}.lastName`}
          label='Last Name'
        />
      {/* </Grid>
      <Grid item xs={12}> */}
        <TextField
          name={`${prefix}.email`}
          type='email'
          label='Email Address'
        />
      {/* </Grid> */}
    </Field>
  )
}

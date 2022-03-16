import { Grid } from '@mui/material'
import { Field, FieldProps, FormikErrors } from 'formik'
import { TextFieldWrapper as TextField } from './TextFieldWrapper'
import { requireArg } from './SubmitPresentationForm'
type PersonProps = {}

export type PersonValues = {
  firstName: string
  lastName: string
  email: string
}

export const Person: React.FC<PersonProps & FieldProps> = ({
  field,
  ...props
}) => {
  const prefix = field.name

  return (
    <Field
      as={'div'}
      name={prefix}
      {...props}
      validate={(values: PersonValues): FormikErrors<PersonValues> => {
        return {
          firstName: requireArg(values.firstName),
          lastName: requireArg(values.lastName),
          email: requireArg(values.email)
        }
      }}
    >
      {/* <Grid item xs={12} md={6}> */}
      <TextField name={`${prefix}.firstName`} label="First Name" />
      {/* </Grid>
      <Grid item xs={12} md={6}> */}
      <TextField name={`${prefix}.lastName`} label="Last Name" />
      {/* </Grid>
      <Grid item xs={12}> */}
      <TextField name={`${prefix}.email`} type="email" label="Email Address" />
      {/* </Grid> */}
    </Field>
  )
}

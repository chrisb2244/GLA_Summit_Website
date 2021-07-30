import { Grid } from '@material-ui/core'
import { TextFieldWrapper as TextField } from './TextFieldWrapper'

interface PersonProps {
  fieldNamePrefix?: string
}

export const Person: React.FC<PersonProps> = (props) => {
  const prefix = props.fieldNamePrefix ?? ''
  const emailFieldName = typeof props.fieldNamePrefix !== 'undefined' ? 'email' : 'primaryemail'
  return (
    <>
      <Grid item xs={12} md={6}>
        <TextField
          name={`${prefix}firstName`}
          label='First Name'
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          name={`${prefix}lastName`}
          label='Last Name'
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          name={`${prefix}${emailFieldName}`}
          type='email'
          label='Email Address'
        />
      </Grid>
    </>
  )
}

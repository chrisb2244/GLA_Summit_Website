import { Grid } from "@material-ui/core"
import { TextFieldWrapper as TextField } from "./TextFieldWrapper"

type PersonProps = {
  fieldNamePrefix?: string
}

export function Person(props: PersonProps) {
  const prefix = props.fieldNamePrefix ?? ''
  const emailFieldName = props.fieldNamePrefix ? 'email' : 'primaryemail'
  return (
    <>
      <Grid item xs={12} md={6}>
        <TextField
          name={`${prefix}firstName`}
          label="First Name"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          name={`${prefix}lastName`}
          label="Last Name"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          name={`${prefix}${emailFieldName}`}
          type="email"
          label="Email Address"
        />
      </Grid>
    </>
  )
}
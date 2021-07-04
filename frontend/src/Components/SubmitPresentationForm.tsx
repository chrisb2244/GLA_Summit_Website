import { Formik, FormikErrors, Form } from "formik";
import { Button, Grid } from '@material-ui/core'
import { TextFieldWrapper as TextField } from "./Form/TextFieldWrapper";
import "./SubmitPresentationForm.css"

interface PresentationFormValues {
  firstName: string
  lastName: string
  email: string
}

export function SubmitPresentationForm() {
  const validate = (values: PresentationFormValues) => {
    console.log(values)
    let errors: FormikErrors<PresentationFormValues> = {};
    console.log(errors)
    if (values.firstName === '') {
      errors.firstName = 'Required'
    }
    console.log(errors)
    return errors
  }
  const initialValues: PresentationFormValues = {
    firstName: '',
    lastName: '',
    email: '',
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values: PresentationFormValues) => {
        alert(JSON.stringify(values, null, 2))
      }}
      validate={validate}
    >
      <Form>
        <Grid container spacing={2} className="gla-submitpresentationform-grid">
          <Grid item xs={12} md={6}>
            <TextField
              name="firstName"
              label="First Name"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="lastName"
              label="Last Name"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              type="email"
              label="Email Address"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="presentationTitle"
              label="Presentation Title"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="abstract"
              label="Presentation Abstract"
              multiline
              className="gla-submitpresentation-abstractbox"
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" color="primary" variant="contained" fullWidth>Submit</Button>
          </Grid>
        </Grid>
      </Form>
    </Formik>
  )
}
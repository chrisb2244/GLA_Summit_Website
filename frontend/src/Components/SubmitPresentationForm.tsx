import { Formik, FormikErrors, Form } from "formik";
import { Button, Grid } from '@material-ui/core'
import { TextFieldWrapper as TextField } from "./Form/TextFieldWrapper";
import "./SubmitPresentationForm.css"

interface PresentationFormValues {
  firstName: string
  lastName: string
  primaryemail: string
  presentationTitle: string
  abstract: string
}

export function SubmitPresentationForm() {
  const require = (value: string, minLength?: number, maxLength?: number) => {
    if(!value) {
      return 'Required'
    }
    if(minLength && value.length < minLength) {
      return `The minimum required length is ${minLength} characters`
    }
    if(maxLength && value.length > maxLength) {
      return `The maximum length is ${maxLength} characters`
    }
    return undefined
  }

  const validate = (values: PresentationFormValues) => {
    let errors: FormikErrors<PresentationFormValues> = {};
    errors.firstName = require(values.firstName);
    errors.lastName = require(values.lastName);
    errors.primaryemail = require(values.primaryemail);
    errors.presentationTitle = require(values.presentationTitle)
    errors.abstract = require(values.abstract, 100, 5000)
    // Need to remove the keys for undefined elements to allow submission
    Object.keys(errors).forEach(key => (errors as any)[key] === undefined && delete (errors as any)[key])
    return errors
  }
  const initialValues: PresentationFormValues = {
    firstName: '',
    lastName: '',
    primaryemail: '',
    presentationTitle: '',
    abstract: '',
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values: PresentationFormValues, actions) => {
        console.log(values, actions)
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
              name="primaryemail"
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
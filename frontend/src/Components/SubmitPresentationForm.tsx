import { Formik, FormikErrors, Form, FieldArray } from "formik";
import { Button, Grid } from '@material-ui/core'
import { TextFieldWrapper as TextField } from "./Form/TextFieldWrapper";
import { Person } from "./Form/Person";
import "./SubmitPresentationForm.css"

interface PresentationFormValues {
  firstName: string
  lastName: string
  primaryemail: string
  presentationTitle: string
  abstract: string
  collaborators: Array<{
    firstName: string
    lastName: string
    email?: string
  }>
}

export function SubmitPresentationForm() {
  const require = (value: string, minLength?: number, maxLength?: number) => {
    if (!value) {
      return 'Required'
    }
    if (minLength && value.length < minLength) {
      return `The minimum required length is ${minLength} characters`
    }
    if (maxLength && value.length > maxLength) {
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
    collaborators: []
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values: PresentationFormValues, actions) => {
        console.log(values, actions)
        alert(JSON.stringify(values, null, 2))
        // actions.resetForm();
      }}
      validate={validate}
    >
      {({values}) => (
      <Form>
        <Grid container spacing={1} className="gla-submitpresentationform-grid">
          <Person />
          <FieldArray name="collaborators">
            {({ insert, remove, push }) => {
              if (!values.collaborators || values.collaborators.length === 0) {
                return (
                  <Grid container item justify="flex-end">
                    <Button onClick={() => push({ firstName: '', lastName: '', email: '' })}>Add collaborator</Button>
                  </Grid>
                )
              }
              return (
                <Grid container item direction="column">
                  <Grid container item spacing={1}>
                    {values.collaborators.map((elem, index) => {
                      const prefix = `collaborators.${index}.`
                      return <Person key={prefix} fieldNamePrefix={prefix} />
                    })}
                  </Grid>
                  <Grid container item justify="flex-end">
                    <Button onClick={() => push({ firstName: '', lastName: '', email: '' })}>Add collaborator</Button>
                  </Grid>
                </Grid>
              )
            }}
          </FieldArray>
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
      )}
    </Formik>
  )
}

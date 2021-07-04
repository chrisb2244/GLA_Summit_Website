import { Formik, FormikErrors, Form, Field } from "formik";
import "./SubmitPresentationForm.css"

interface PresentationFormValues {
  firstName: string
  lastName: string
  email: string
}

export function SubmitPresentationForm() {
  const validate = (values: any) => {
    let errors: FormikErrors<PresentationFormValues> = {};
    if (!values.firstName) {
      errors.firstName = 'Required'
    }
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

      {({ errors, touched }) => (
        <Form>
          <label htmlFor="firstName">First Name</label>
          <Field
            id="firstName"
            name="firstName"
            type="text"
          />
          {errors.firstName && touched.firstName ? <div>{errors.firstName}</div> : null}

          <label htmlFor="lastName">Last Name</label>
          <Field
            id="lastName"
            name="lastName"
            type="text"
          />
          {errors.lastName && touched.lastName ? <div>{errors.lastName}</div> : null}

          <label htmlFor="email">Email Address</label>
          <Field
            id="email"
            name="email"
            type="email"
          />
          {errors.email && touched.email ? <div>{errors.email}</div> : null}

          <button type="submit">Submit</button>
        </Form>)}
    </Formik>
  )
}
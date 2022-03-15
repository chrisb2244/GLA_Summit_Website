import { Formik, FormikErrors, Form, FieldArray, Field, useFormik } from 'formik'
import { Button, Grid } from '@mui/material'
import { TextFieldWrapper as TextField } from './TextFieldWrapper'
import { PersonValues, Person } from './Person'
import { PersonArray } from './PersonArray'
// import './SubmitPresentationForm.css'

interface PresentationFormValues {
  firstPresenter: PersonValues
  presentationTitle: string
  abstract: string
  collaborators: Array<{
    firstName: string
    lastName: string
    email?: string
  }>
}

export const requireArg = (value: string, minLength?: number, maxLength?: number): string | undefined => {
  if (value.trim().length === 0) {
    return 'Required'
  }
  if (typeof minLength !== 'undefined' && value.length < minLength) {
    return `The minimum required length is ${minLength} characters`
  }
  if (typeof maxLength !== 'undefined' && value.length > maxLength) {
    return `The maximum length is ${maxLength} characters`
  }
  return undefined
}

export const SubmitPresentationForm: React.FC = () => {
  const validate = (values: PresentationFormValues): FormikErrors<PresentationFormValues> => {
    const errors: FormikErrors<PresentationFormValues> = {}
    errors.presentationTitle = requireArg(values.presentationTitle)
    errors.abstract = requireArg(values.abstract, 100, 5000)
    // Need to remove the keys for undefined elements to allow submission
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    Object.keys(errors).forEach(key => (errors as any)[key] === undefined && delete (errors as any)[key])
    return errors
  }

  const initialValues: PresentationFormValues = {
    firstPresenter: {
    firstName: '',
    lastName: '',
    email: '',
    },
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
      {({ values, ...props }) => (
        <Form>
          <Grid container spacing={1} className='gla-submitpresentationform-grid'>
            <Person form={{...props, values}} field={props.getFieldProps<PersonValues>('firstPresenter')} meta={props.getFieldMeta('firstPresenter')}/>
            <PersonArray form={{...props, values}} field={props.getFieldProps<Array<PersonValues>>('collaborators')} meta={props.getFieldMeta('collaborators')} />
              {/* {({ insert, remove, push }) => {
                if (values.collaborators.length === 0) {
                  return (
                    <Grid container item justifyContent='flex-end'>
                      <Button onClick={() => push({ firstName: '', lastName: '', email: '' })}>Add collaborator</Button>
                    </Grid>
                  )
                }
                return (
                  <Grid container item direction='column'>
                    <Grid container item spacing={1}>
                      {values.collaborators.map((elem, index) => {
                        const prefix = `collaborators.${index}.`
                        return <Field component={Person} key={prefix} name={prefix} />
                      })}
                    </Grid>
                    <Grid container item justifyContent='flex-end'>
                      <Button onClick={() => push({ firstName: '', lastName: '', email: '' })}>Add collaborator</Button>
                    </Grid>
                  </Grid>
                )
              }}
            </FieldArray> */}
            <Grid item xs={12}>
              <TextField
                name='presentationTitle'
                label='Presentation Title'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name='abstract'
                label='Presentation Abstract'
                multiline
                className='gla-submitpresentation-multilinebox'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name='learningPoint'
                label='In your opinion, what is the most important thing attendees can learn from your presentation?'
                multiline
                className='gla-submitpresentation-multilinebox'
              />
            </Grid>
            <Grid item xs={12}>
              <Button type='submit' color='primary' variant='contained' fullWidth>Submit</Button>
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  )
}

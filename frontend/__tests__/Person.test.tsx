import { fireEvent, render, waitFor } from '@testing-library/react'
import { PersonValues, Person } from '@/Components/Form/Person'
import { Formik } from 'formik'

describe('Person', () => {
  const initialValues = {
    person: {
      firstName: '',
      lastName: '',
      email: ''
    }
  }
  const form = (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {({ ...props }) => {
        const field = props.getFieldProps<PersonValues>('person')
        const meta = props.getFieldMeta('person')
        return <Person form={{ ...props }} field={field} meta={meta} />
      }}
    </Formik>
  )

  it('has first and last name and email text inputs', () => {
    const person = render(form)
    const inputs = person.getAllByRole('textbox')

    const hasFirstName = inputs.some((elem) => elem.id === 'person.firstName')
    const hasLastName = inputs.some((elem) => elem.id === 'person.lastName')
    const hasEmail = inputs.some((elem) => elem.id === 'person.email')

    expect(hasFirstName).toBeTruthy()
    expect(hasLastName).toBeTruthy()
    expect(hasEmail).toBeTruthy()
  })

  // it('validates email appropriately', async () => {
  //   await waitFor(() => {
  //     const person = render(form)
  //     const emailInput = person.getByRole('textbox', { name: 'Email Address' })
  //     userEvent.type(emailInput, 'blah')
  //     console.log(emailInput.getAttribute('error'))
  //     expect(emailInput.getAttribute('error')).not.toBeNull()
  //   })
  // })

  it('requires firstName after click', async () => {
    const person = render(form)
    const firstName = person.getByRole('textbox', { name: 'First Name' })
    expect(firstName).toBeValid()
    fireEvent.blur(firstName)
    await waitFor(() => expect(firstName).toBeInvalid())
  })
})

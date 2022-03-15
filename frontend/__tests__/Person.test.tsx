import { act, fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { initialPersonValues, Person } from '@/Components/Form/Person'
import { Formik, Field } from 'formik'

describe('Person', () => {
  const initialValues: initialPersonValues = {
    firstName: '',
    lastName: '',
    email: '',
  }
  const form = (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      <Field component={Person} name='person' />
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

  it('requires firstName after click', () => {
    act(() => {
      const person = render(form)
      const firstName = person.getByRole('textbox', { name: 'First Name' })
      // const lastName = person.getByRole('textbox', { name: 'Last Name' })
      expect(firstName).toBeValid()
      fireEvent.blur(firstName)
      // userEvent.click(firstName)
      // userEvent.click(lastName)
      expect(firstName).toBeInvalid()
    })
  })
})

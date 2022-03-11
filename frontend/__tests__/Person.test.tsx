import { render, within } from '@testing-library/react'
import { initialPersonValues, Person } from '@/Components/Form/Person'
import { Formik } from 'formik'

describe('Person', () => {
  const initialValues: initialPersonValues = {
    firstName: '', lastName: '', email: ''
  }
  const form = <Formik initialValues={initialValues} onSubmit={() => {}}>
    <Person />
  </Formik>

  it('has first and last name and email text inputs', () => {
    const person = render(form)
    const inputs = person.getAllByRole('textbox')

    const hasFirstName = inputs.some((elem) => elem.id === 'firstName')
    const hasLastName = inputs.some((elem) => elem.id === 'lastName')
    const hasEmail = inputs.some((elem) => elem.id === 'primaryemail')

    expect(hasFirstName).toBeTruthy()
    expect(hasLastName).toBeTruthy()
    expect(hasEmail).toBeTruthy()
  })
})

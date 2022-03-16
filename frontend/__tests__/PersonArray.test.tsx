import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PersonArray } from '@/Components/Form/PersonArray'
import { PersonValues } from '@/Components/Form/Person'
import { Formik } from 'formik'

describe('PersonArray', () => {
  const initialValues: {
    people: Array<PersonValues>
  } = { people: [] }
  const form = (addLabel?: string) => (
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      {({ ...props }) => {
        const field = props.getFieldProps<PersonValues>('people')
        const meta = props.getFieldMeta('people')
        return (
          <PersonArray
            addLabel={addLabel}
            form={{ ...props }}
            field={field}
            meta={meta}
          />
        )
      }}
    </Formik>
  )

  it('initially has zero Persons', () => {
    const arr = render(form())
    const inputs = arr.queryAllByRole('textbox')
    expect(inputs).toHaveLength(0)
  })

  it('initially has a button to add a Person', () => {
    const arr = render(form())
    const button = arr.getByRole('button')
    expect(button).toHaveTextContent('Add')
  })

  it('allows a different label for the add button', () => {
    const label = 'other label for button'
    const arr = render(form(label))
    const button = arr.getByRole('button')
    expect(button).toHaveTextContent(label)
  })

  it('adds a person when the Add button is clicked', async () => {
    const arr = render(form())
    const button = arr.getByRole('button')
    userEvent.click(button)

    const inputs = arr.queryAllByRole('textbox')
    await waitFor(() => expect(inputs).toHaveLength(3)) // firstName, lastName, email
  })

  // const hasFirstName = inputs.some((elem) => elem.id === 'person.firstName')
  // const hasLastName = inputs.some((elem) => elem.id === 'person.lastName')
  // const hasEmail = inputs.some((elem) => elem.id === 'person.email')

  // expect(hasFirstName).toBeTruthy()
  // expect(hasLastName).toBeTruthy()
  // expect(hasEmail).toBeTruthy()

  // it('validates email appropriately', async () => {
  //   await waitFor(() => {
  //     const person = render(form)
  //     const emailInput = person.getByRole('textbox', { name: 'Email Address' })
  //     userEvent.type(emailInput, 'blah')
  //     console.log(emailInput.getAttribute('error'))
  //     expect(emailInput.getAttribute('error')).not.toBeNull()
  //   })
  // })

  // it('requires firstName after click', async () => {
  //   const person = render(form)
  //   const firstName = person.getByRole('textbox', { name: 'First Name' })
  //   expect(firstName).toBeValid()
  //   fireEvent.blur(firstName)
  //   await waitFor(() => expect(firstName).toBeInvalid())
  // })
})

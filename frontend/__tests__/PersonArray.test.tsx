import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, of, useFieldArray } from 'react-hook-form'
import { PersonArrayFormComponent } from '@/Components/Form/PersonArray'
import type { PersonProps } from '@/Components/Form/Person'
import { Button } from '@mui/material'

type FormData = {
  people: PersonProps[]
}

const Form = (props: {addlabel?: string}): JSX.Element => {
  const {
    register,
    control,
    formState: { errors }
  } = useForm<FormData>()
  const { fields, append, remove } = useFieldArray<FormData, 'people'>({
    name: 'people',
    control
  })
  return (
    <>
      <PersonArrayFormComponent<FormData>
        personArray={fields}
        arrayPath={of('people')}
        errors={errors.people}
        register={register}
        removePresenter={remove}
      />
      <Button
        fullWidth
        onClick={() => {
          append({})
        }}
        variant='outlined'
      >
        {props.addlabel ?? 'Add Presenter'}
      </Button>
    </>
  )
}
describe('PersonArray', () => {
  const renderForm = (addLabel?: string): { button: HTMLElement } => {
    const view = render(<Form addlabel={addLabel}/>)
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const button = view.getByRole('button')
    return { button }
  }

  it('initially has zero Persons', () => {
    render(<Form />)
    const inputs = screen.queryAllByRole('textbox')
    expect(inputs).toHaveLength(0)
  })

  it('initially has a button to add a Person', () => {
    const { button } = renderForm()
    expect(button).toHaveTextContent('Add')
  })

  it('allows a different label for the add button', () => {
    const label = 'other label for button'
    const { button } = renderForm(label)
    expect(button).toHaveTextContent(label)
  })

  it('adds a person when the Add button is clicked', async () => {
    const { button } = renderForm()
    userEvent.click(button)

    const inputs = screen.queryAllByRole('textbox')
    await waitFor(() => expect(inputs).toHaveLength(3)) // firstName, lastName, email
  })

  it('has a Delete button when a Person exists', async () => {
    const { button: addButton } = renderForm()
    userEvent.click(addButton)

    const deleteButtonCandidates = screen
      .getAllByRole('button')
      .filter((elem) => {
        return elem !== addButton
      })

    await waitFor(() => expect(deleteButtonCandidates).toHaveLength(1))
    await waitFor(() => expect(deleteButtonCandidates[0]).toBeVisible())
  })

  it('has a functioning Delete button', async () => {
    const { button: addButton } = renderForm()
    userEvent.click(addButton)

    const deleteButton = screen
      .getAllByRole('button')
      .filter((elem) => elem !== addButton)[0]
    userEvent.click(deleteButton)

    const inputs = screen.queryAllByRole('textbox')
    await waitFor(() => expect(inputs).toHaveLength(0))
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

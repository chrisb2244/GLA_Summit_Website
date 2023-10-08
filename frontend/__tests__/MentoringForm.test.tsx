import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MentoringForm, RegistrationData, RegistrationType } from '@/Components/Forms/MentoringForm'
import { PersonProps } from '@/Components/Form'

const existingPerson = {
  firstName: 'Test', lastName: 'User', email: 'test.user@test.com'
}

// Don't test validation of the Person elements,
// there are separate tests for that already
describe('MentoringForm', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const submitFn = jest.fn<void, [RegistrationData]>(async (data) => {})

  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  const getInput = (name: 'First Name' | 'Last Name' | 'Email') => {
    return screen.getByRole('textbox', {name})
  }

  const renderForm = (person: PersonProps | undefined, registered: RegistrationType | null) => {
    return render(<MentoringForm
      registrationFn={submitFn}
      defaultEntry={person}
      registered={registered}
    />)
  }

  // it('contains an empty Person form when the passed user is undefined', () => {
  //   renderForm(undefined, null)
  //   const textboxes = screen.getAllByRole('textbox')
  //   expect(textboxes).toHaveLength(3)
  //   textboxes.forEach(tbox => {
  //     expect(tbox).toHaveValue('')
  //     expect(tbox).not.toHaveAttribute('readonly')
  //   })
  // })

  it('contains a prefilled Person form when the passed user is defined', () => {
    renderForm(existingPerson, null)
    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes).toHaveLength(3)
    expect(getInput('First Name')).toHaveValue('Test')
    expect(getInput('Last Name')).toHaveValue('User')
    expect(getInput('Email')).toHaveValue('test.user@test.com')
    textboxes.forEach(tbox => {
      expect(tbox).toHaveAttribute('readonly')
    })
  })

  it('has no boxes if told a mentor registration exists', () => {
    renderForm(existingPerson, 'mentor')
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.getByText(/Thank you.*registered.*to be a mentor/)).toBeVisible()
  })

  it('has no boxes if told a mentee registration exists', () => {
    renderForm(existingPerson, 'mentee')
    expect(screen.queryAllByRole('textbox')).toHaveLength(0)
    expect(screen.getByText(/Thank you.*received/)).toBeVisible()
  })

  it('allows registration as a mentor for an existing user', async () => {
    renderForm(existingPerson, null)
    const submitButton = screen.getByRole('button')
    userEvent.click(submitButton)
    // default is being a mentor...
    await waitFor(() => {
      return expect(submitFn).toBeCalledWith({
        person: existingPerson,
        type: 'mentor'
      })
    })
  })

  it('allows registration as a mentee for an existing user', async () => {
    renderForm(existingPerson, null)
    const menteeButton = screen.getByRole('tab', { name: /Receive Mentorship/i})
    const submitButton = screen.getByRole('button')
    userEvent.click(menteeButton)
    userEvent.click(submitButton)
    await waitFor(() => {
      return expect(submitFn).toBeCalledWith({
        person: existingPerson,
        type: 'mentee'
      })
    })
  })

  // it('allows a non-logged-in user to submit as a mentor', async () => {
  //   renderForm(undefined, null)
  //   userEvent.type(getInput('First Name'), existingPerson.firstName)
  //   userEvent.type(getInput('Last Name'), existingPerson.lastName)
  //   userEvent.type(getInput('Email'), existingPerson.email)
  //   const submitButton = screen.getByRole('button')
  //   userEvent.click(submitButton)
  //   await waitFor(() => {
  //     return expect(submitFn).toBeCalledWith({
  //       person: existingPerson,
  //       type: 'mentor'
  //     })
  //   })
  // })

  // it('allows a non-logged-in user to submit as a mentee (click first)', async () => {
  //   renderForm(undefined, null)
  //   const menteeButton = screen.getByRole('tab', { name: /Receive Mentorship/i})
  //   userEvent.click(menteeButton)
  //   userEvent.type(getInput('First Name'), existingPerson.firstName)
  //   userEvent.type(getInput('Last Name'), existingPerson.lastName)
  //   userEvent.type(getInput('Email'), existingPerson.email)
  //   const submitButton = screen.getByRole('button')
  //   userEvent.click(submitButton)
  //   await waitFor(() => {
  //     return expect(submitFn).toBeCalledWith({
  //       person: existingPerson,
  //       type: 'mentee'
  //     })
  //   })
  // })

  // it('allows a non-logged-in user to submit as a mentee (click after)', async () => {
  //   renderForm(undefined, null)
  //   const menteeButton = screen.getByRole('tab', { name: /Receive Mentorship/i})
  //   userEvent.type(getInput('First Name'), existingPerson.firstName)
  //   userEvent.type(getInput('Last Name'), existingPerson.lastName)
  //   userEvent.type(getInput('Email'), existingPerson.email)
  //   userEvent.click(menteeButton)
  //   const submitButton = screen.getByRole('button')
  //   userEvent.click(submitButton)
  //   await waitFor(() => {
  //     return expect(submitFn).toBeCalledWith({
  //       person: existingPerson,
  //       type: 'mentee'
  //     })
  //   })
  // })

  // Just one check on validation...
  // Uncommenting the line that sets last name causes this test to fail
  it('validates the form and prevents submission', async () => {
    // renderForm(undefined, null)
    render(<MentoringForm
      registrationFn={submitFn}
      defaultEntry={undefined}
      registered={null}
    />)
    userEvent.type(getInput('First Name'), existingPerson.firstName)
    userEvent.type(getInput('Email'), existingPerson.email)

    const lastNameInput = getInput('Last Name')
    // userEvent.type(lastNameInput, existingPerson.lastName)

    const submitButton = screen.getByRole('button')
    
    await waitFor(() => {
      userEvent.click(submitButton)
      expect(lastNameInput).toBeInvalid()
    })
    expect(submitFn).toBeCalledTimes(0)
  })

})

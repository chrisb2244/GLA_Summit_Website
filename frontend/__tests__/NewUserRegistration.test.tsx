import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewUserRegistration } from '@/Components/SigninRegistration/NewUserRegistration'

describe('NewUserRegistration', () => {
  const form = (
    <NewUserRegistration open setClosed={() => {}} switchToSignIn={() => {}} />
  )

  it('contains an input for first name', () => {
    render(form)
    expect(screen.getByRole('textbox', { name: /First name/i })).toBeVisible()
  })

  it('contains an input for last name', () => {
    render(form)
    expect(screen.getByRole('textbox', { name: /Last name/i })).toBeVisible()
  })

  it('contains an input for email', () => {
    render(form)
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeVisible()
  })

  it('displays an error for invalid email', async () => {
    render(form)
    const email = screen.getByRole('textbox', { name: /Email/i })
    expect(email).toBeValid()

    userEvent.type(email, 'blahWithNoAtSymbol')
    fireEvent.blur(email)
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible())
    await waitFor(() => expect(email).toBeInvalid())
  })

  it('remains valid with a pattern-suitable email', async () => {
    render(form)
    const email = screen.getByRole('textbox', { name: /Email/i })
    expect(email).toBeValid()

    userEvent.type(email, 'my.email@provider.com')
    fireEvent.blur(email)
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    await waitFor(() => expect(email).toBeValid())
  })

  it('includes a button to switch to signin', () => {
    render(form)
    const signinButton = screen.getByRole('button', { name: /Sign[- ]?in/i })
    expect(signinButton).toBeVisible()
  })
})

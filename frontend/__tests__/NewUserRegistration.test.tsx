import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { NewUserRegistration } from '@/Components/User/NewUserRegistration'

describe('NewUserRegistration', () => {
  const form = <NewUserRegistration open={true} setClosed={()=>{}}/>

  it('contains an input for first name', () => {
    render(form)
    expect(screen.getByRole('textbox', {name: /First name/i})).toBeVisible()
  })

  it('contains an input for last name', () => {
    render(form)
    expect(screen.getByRole('textbox', {name: /Last name/i})).toBeVisible()
  })

  it('contains an input for email', () => {
    render(form)
    expect(screen.getByRole('textbox', {name: /Email/i})).toBeVisible()
  })

  it('displays an error for invalid email', () => {
    render(form)
    const email = screen.getByRole('textbox', {name: /Email/i})
    userEvent.type(email, 'blahWithNoAtSymbol')
    const firstName = screen.getByRole('textbox', {name: /First name/i})
    // fireEvent.blur(email)
    userEvent.click(firstName)
    expect(screen.getByRole('alert', {})).toBeVisible()
  })
})

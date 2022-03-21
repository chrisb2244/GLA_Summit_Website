import { render } from '@testing-library/react'
import { NewUserRegistration } from '@/Components/User/NewUserRegistration'

// jest.mock('next-auth/react', () => {
//   return {
//     __esModule: true,
//     ...jest.requireActual('next-auth/react'),
//     useSession: jest.fn()
//   }
// })

// type useSessionFn = jest.MockedFunction<typeof useSession>

describe('NewUserRegistration', () => {
  it('contains an input for first name', () => {
    const regForm = render(<NewUserRegistration open={true} setClosed={()=>{}}/>)
    expect(regForm.getByRole('textbox', {name: 'First name'})).toBeVisible()
  })

})

import { render } from '@testing-library/react'
import { User } from '@/Components/User'
import { Header } from '@/Components/Header'
import { useSession } from 'next-auth/react'
import { Session } from 'next-auth'

jest.mock('next-auth/react', () => {
  return {
    __esModule: true,
    ...jest.requireActual('next-auth/react'),
    useSession: jest.fn()
  }
})

type useSessionFn = jest.MockedFunction<typeof useSession>

describe('User', () => {
  it('is included in the menu', () => {
    (useSession as useSessionFn).mockImplementation(() => {
      return { data: null, status: "unauthenticated"}
    })

    const header = render(<Header />).container
    const user = render(<User />).container.innerHTML
    expect(header).toContainHTML(user)
  })

  it('provides a button to sign in if not signed in', () => {
    (useSession as useSessionFn).mockImplementation(() => {
      return { data: null, status: "unauthenticated"}
    })

    const user = render(<User />)
    expect(user.container).toHaveTextContent('Not signed in')
  })

  it('logs in with auth data', () => {
    (useSession as useSessionFn).mockImplementation(() => {
      return { data: {
        expires: '1',
        user: {
          name: 'Test User'
        }
      }, status: "authenticated"}
    })

    const user = render(<User />)
    expect(user.container).toHaveTextContent('Signed in as Test User')
  })
})

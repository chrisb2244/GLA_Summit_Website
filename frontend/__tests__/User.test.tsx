import { render } from '@testing-library/react'
import { User } from '@/Components/User'
import { Header } from '@/Components/Header'
import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

describe('User', () => {
  it('is included in the menu', () => {
    const mockSession: Session = {
      expires: '1',
      user: { email: 'a', name: 'Test User' }
    }

    const header = render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    ).container
    const user = render(
      <SessionProvider session={mockSession}>
        <User />
      </SessionProvider>
    ).container.innerHTML
    expect(header).toContainHTML(user)
  })

  
})

import { render, waitFor, screen } from '@testing-library/react'
import { User } from '@/Components/User/User'
import { Header } from '@/Components/Header'
import type { Session } from '@supabase/supabase-js'
import type { ProfileModel } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'

const dummySession: Session = {
  user: {
    email: 'test@user.com',
    id: 'test@user.com',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: ''
  },
  access_token: '',
  token_type: 'bearer'
}

const mockedSession = useSession as jest.MockedFunction<typeof useSession>
const dummyReturn = {
  isOrganizer: false,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn()
}

jest.mock('@/lib/sessionContext')

describe('User', () => {
  it('is included in the menu', () => {
    mockedSession.mockReturnValue({...dummyReturn, profile: null, session: null})
    const header = render(<Header />).container
    const user = render(<User />).container.innerHTML
    expect(header).toContainHTML(user)
  })

  it('provides a link to sign in if not signed in', () => {
    mockedSession.mockReturnValue({...dummyReturn, profile: null, session: null})
    render(<User />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /Register/i })).toBeVisible()
  })

  it('shows email if no name available', async () => {
    mockedSession.mockReturnValue({
      ...dummyReturn,
      session: dummySession,
      profile: null
    })
    render(<User />)
    await waitFor(() => {
      expect(screen.getByText('test@user.com')).toBeVisible()
    })
  })

  it('shows name rather than email if both are available', async () => {
    const localpm: ProfileModel = {
      firstname: 'Test',
      lastname: 'User',
      id: '',
      avatar_url: null,
      website: null,
      bio: null
    }
    
    mockedSession.mockReturnValue({
      ...dummyReturn,
      session: dummySession,
      profile: localpm
    })

    render(<User />)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeVisible()
    })
  })
})

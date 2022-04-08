import { render, waitFor, screen } from '@testing-library/react'
import { User } from '@/Components/User/User'
import { Header } from '@/Components/Header'
import type { Session } from '@supabase/supabase-js'
import { getProfileInfo, ProfileModel } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'

jest.mock('@/lib/supabaseClient', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@/lib/supabaseClient'),
    getProfileInfo: jest.fn(() => {
      const pm: ProfileModel = {
        firstname: '',
        lastname: '',
        id: '',
        avatar_url: null,
        website: null
      }
      return Promise.resolve(pm)
    })
  }
})
jest.mock('@/lib/sessionContext')

describe('User', () => {
  it('is included in the menu', () => {
    const header = render(<Header />).container
    const user = render(<User />).container.innerHTML
    expect(header).toContainHTML(user)
  })

  it('provides a link to sign in if not signed in', () => {
    render(<User />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /Register/i })).toBeVisible()
  })

  it('shows email if no name available', async () => {
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
    ;(useSession as jest.MockedFunction<typeof useSession>).mockReturnValue(
      dummySession
    )
    render(<User />)
    await waitFor(() => {
      expect(screen.getByText('test@user.com')).toBeVisible()
    })
  })

  it('shows name rather than email if both are available', async () => {
    const pm: ProfileModel = {
      firstname: 'Test',
      lastname: 'User',
      id: '',
      avatar_url: null,
      website: null
    }
    ;(
      getProfileInfo as jest.MockedFunction<typeof getProfileInfo>
    ).mockResolvedValue(pm)
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
    ;(useSession as jest.MockedFunction<typeof useSession>).mockReturnValue(
      dummySession
    )

    render(<User />)
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeVisible()
    })
  })
})

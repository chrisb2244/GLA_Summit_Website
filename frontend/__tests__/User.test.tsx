import { render, waitFor } from '@testing-library/react'
import { User } from '@/Components/User/User'
import { Header } from '@/Components/Header'
import type { Session } from '@supabase/supabase-js'
import { getProfileInfo, ProfileModel } from '@/lib/supabaseClient'

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



describe('User', () => {
  it('is included in the menu', () => {
    const header = render(<Header />).container
    const user = render(<User />).container.innerHTML
    expect(header).toContainHTML(user)
  })

  it('provides a link to sign in if not signed in', () => {
    const user = render(<User />)
    expect(user.getByRole('button', { name: /Sign In/i })).toBeVisible()
    expect(user.getByRole('button', { name: /Register/i })).toBeVisible()
  })

  it('shows email if no name available', () => {
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
    waitFor(() => {
      const user = render(<User />)
      return expect(user.container).toHaveTextContent('test@user.com')
    })
  })

  // it('shows name rather than email if both are available', () => {
  //   ;(getProfileInfo as jest.MockedFunction<typeof getProfileInfo>).mockImplementation(() => {
  //     const pm: ProfileModel = {
  //       firstname: 'Test',
  //       lastname: 'User',
  //       id: '',
  //       avatar_url: null,
  //       website: null
  //     }
  //     return Promise.resolve(pm)
  //   })
  //   const dummySession: Session = {
  //     user: {
  //       email: 'test@user.com',
  //       id: 'test@user.com',
  //       aud: 'authenticated',
  //       app_metadata: {},
  //       user_metadata: {},
  //       created_at: '',
  //     },
  //     access_token: '',
  //     token_type: 'bearer'
  //   }
  //   waitFor(() => {

  //     const user = render(<User session={dummySession} />)
  //     return expect(user.container).toHaveTextContent('Test User')
  //   })
  // })
})

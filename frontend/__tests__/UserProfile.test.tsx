import { render } from '@testing-library/react'
import { UserProfile } from '@/Components/User/UserProfile'
import { getProfileInfo, ProfileModel } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'
import type { Session } from '@supabase/supabase-js'

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
    }),
    supabase: {
      auth: {
        session: jest.fn()
      }
    }
  }
})

jest.mock('@/lib/sessionContext')

type GetProfileFnType = jest.MockedFunction<typeof getProfileInfo>
type UseSessionFnType = jest.MockedFunction<typeof useSession>

describe('UserProfile', () => {
  it('indicates when not signed in', () => {
    ;(getProfileInfo as GetProfileFnType).mockImplementation(() => {
      return Promise.resolve(null)
    })
    const profile = render(<UserProfile />)
    expect(profile.getByText(/not signed in/i)).toBeVisible()
  })

  it('indicates when loading profile', async () => {
    ;(getProfileInfo as GetProfileFnType).mockImplementation(() => {
      return Promise.resolve(null)
    })
    ;(useSession as UseSessionFnType).mockImplementation(() => {
      const dummySession: Session = {
        access_token: '',
        token_type: 'bearer',
        user: {
          app_metadata: {},
          aud: '',
          created_at: '',
          id: 'myid',
          user_metadata: {}
        }
      }
      return dummySession
    })
    const profile = render(<UserProfile />)
    expect(profile.getByText(/Loading/i)).toBeVisible()
  })
})

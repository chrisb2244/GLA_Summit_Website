import { render, screen, waitFor } from '@testing-library/react'
import { UserProfile } from '@/Components/User/UserProfile'
import { getProfileInfo, ProfileModel } from '@/lib/supabaseClient'
import { useSession } from '@/lib/sessionContext'
import type { Session } from '@supabase/supabase-js'

jest.mock('@/lib/supabaseClient', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@/lib/supabaseClient'),
    getProfileInfo: jest.fn(),
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

const mockProfile = getProfileInfo as GetProfileFnType
const mockSession = useSession as UseSessionFnType

const dummySession: Session = {
  access_token: '',
  token_type: 'bearer',
  user: {
    app_metadata: {},
    aud: '',
    created_at: '',
    id: 'mytestid',
    user_metadata: {}
  }
}

const dummyProfile: ProfileModel = {
  firstname: 'Test',
  lastname: 'User',
  id: 'mytestid',
  avatar_url: null,
  website: null
}

const setMockImplementations = (
  type: 'signed-in' | 'loading' | 'signed-out'
) => {
  if (type === 'signed-out') {
    mockProfile.mockResolvedValue(null)
    mockSession.mockReturnValue(null)
  } else if (type === 'loading') {
    mockProfile.mockResolvedValue(null)
    mockSession.mockReturnValue(dummySession)
  } else if (type === 'signed-in') {
    mockProfile.mockResolvedValue(dummyProfile)
    mockSession.mockReturnValue(dummySession)
  }
}

const resetMockImplementations = () => {
  mockProfile.mockReset()
  mockSession.mockReset()
}

describe('UserProfile', () => {
  beforeEach(() => {
    resetMockImplementations()
  })

  it('indicates when not signed in', () => {
    setMockImplementations('signed-out')
    render(<UserProfile />)
    expect(screen.getByText(/not signed in/i)).toBeVisible()
  })

  it('indicates when loading profile', () => {
    setMockImplementations('loading')
    render(<UserProfile />)
    expect(screen.getByText(/Loading/i)).toBeVisible()
  })

  it('contains a prefilled firstname input', async () => {
    setMockImplementations('signed-in')

    render(<UserProfile />)
    await waitFor(async () => {
       expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('Test')
    })
  })
})

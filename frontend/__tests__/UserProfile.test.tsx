import { render, screen, waitFor } from '@testing-library/react'
import { UserProfile } from '@/Components/User/UserProfile'
import { useSession } from '@/lib/sessionContext'
import type { ProfileModel } from '@/lib/sessionContext'
import userEvent from '@testing-library/user-event'

jest.mock('@/lib/profileImage')
jest.mock('@/lib/sessionContext')

// type GetProfileFnType = jest.MockedFunction<typeof getProfileInfo>
type UseSessionFnType = jest.MockedFunction<typeof useSession>

// const mockProfile = getProfileInfo as GetProfileFnType
const mockSession = useSession as UseSessionFnType

const defaultSessionElems = {
  isOrganizer: false,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn()
}

const dummySession = {
  session: {
    access_token: '',
    token_type: 'bearer',
    user: {
      app_metadata: {},
      aud: '',
      created_at: '',
      id: 'mytestid',
      user_metadata: {}
    }
  },
  ...defaultSessionElems
}

const dummyProfile: ProfileModel = {
  firstname: 'Test',
  lastname: 'User',
  id: 'mytestid',
  avatar_url: null,
  website: null,
  bio: null
}

const setMockImplementations = (
  type: 'signed-in' | 'loading' | 'signed-out'
) => {
  if (type === 'signed-out') {
    // mockProfile.mockResolvedValue(null)
    mockSession.mockReturnValue({session: null, profile: null, ...defaultSessionElems})
  } else if (type === 'loading') {
    // mockProfile.mockResolvedValue(null)
    mockSession.mockReturnValue({...dummySession, profile: null})
  } else if (type === 'signed-in') {
    // mockProfile.mockResolvedValue(dummyProfile)
    mockSession.mockReturnValue({...dummySession, profile: dummyProfile})
  }
}

const resetMockImplementations = () => {
  // mockProfile.mockReset()
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
      expect(
        await screen.findByRole('textbox', { name: /first name/i })
      ).toHaveValue('Test')
    })
  })

  it('contains a prefilled lastname input', async () => {
    setMockImplementations('signed-in')

    render(<UserProfile />)
    await waitFor(async () => {
      expect(
        await screen.findByRole('textbox', { name: /last name/i })
      ).toHaveValue('User')
    })
  })

  it('has a button to update the profile', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    expect(await screen.findByRole('button', { name: /update/i })).toBeVisible()
  })

  it('has a disabled button when no values changed', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })

  it('has an enabled button when values have been changed', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })
    userEvent.clear(firstNameInput)
    userEvent.type(firstNameInput, 'different first name')
    expect(await screen.findByRole('button', { name: /update/i })).toBeEnabled()
  })

  it('has a disabled button if reverted to saved values', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })

    userEvent.clear(firstNameInput)
    userEvent.type(firstNameInput, 'different first name')
    userEvent.clear(firstNameInput)
    userEvent.type(firstNameInput, 'Test')

    await waitFor(async () => {
      expect(
        await screen.findByRole('button', { name: /update/i })
      ).toBeDisabled()
    })
  })

  it('has a disabled button if empty first name', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })

    userEvent.clear(firstNameInput)

    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })

  it('has a disabled button if empty last name', async () => {
    setMockImplementations('signed-in')
    render(<UserProfile />)
    const lastNameInput = await screen.findByRole('textbox', {
      name: /last name/i
    })

    userEvent.clear(lastNameInput)

    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })
})

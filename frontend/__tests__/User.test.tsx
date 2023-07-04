// import { render, waitFor, screen } from '@testing-library/react'
// import { User } from '@/Components/User/User'
// import { Header } from '@/Components/Header'
// import type { User as SB_UserType } from '@supabase/supabase-js'
// import type { ProfileModel } from '@/lib/databaseModels'
// import { useSession } from '@/lib/sessionContext'

// jest.mock('@/lib/profileImage')

// const dummyUser: SB_UserType = {
//   email: 'test@user.com',
//   id: 'test@user.com',
//   aud: 'authenticated',
//   app_metadata: {},
//   user_metadata: {},
//   created_at: ''
// }

// const mockedSession = useSession as jest.MockedFunction<typeof useSession>
// const dummyReturn = {
//   isOrganizer: false,
//   isLoading: false,
//   signIn: jest.fn(),
//   signUp: jest.fn(),
//   signOut: jest.fn(),
//   timezoneInfo: {
//     timeZone: '',
//     timeZoneName: '',
//     use24HourClock: false
//   },
//   triggerUpdate: jest.fn()
// }

// jest.mock('@/lib/sessionContext')

// describe('User', () => {
//   it('is included in the menu', () => {
//     mockedSession.mockReturnValue({ ...dummyReturn, profile: null, user: null })
//     render(<Header />).container
//     expect(screen.getByRole('button', { name: /Sign In/i })).toBeVisible()
//     expect(screen.getByRole('button', { name: /Register/i })).toBeVisible()
//   })

//   it('provides a link to sign in if not signed in', () => {
//     mockedSession.mockReturnValue({ ...dummyReturn, profile: null, user: null })
//     render(<User />)
//     expect(screen.getByRole('button', { name: /Sign In/i })).toBeVisible()
//     expect(screen.getByRole('button', { name: /Register/i })).toBeVisible()
//   })

//   it('shows email if no name available', async () => {
//     mockedSession.mockReturnValue({
//       ...dummyReturn,
//       user: dummyUser,
//       profile: null
//     })
//     render(<User />)
//     await waitFor(() => {
//       expect(screen.getByText('test@user.com')).toBeVisible()
//     })
//   })

//   it('shows name rather than email if both are available', async () => {
//     const localpm: ProfileModel['Row'] = {
//       firstname: 'Test',
//       lastname: 'User',
//       id: '',
//       avatar_url: null,
//       website: null,
//       bio: null,
//       updated_at: new Date().toISOString()
//     }

//     mockedSession.mockReturnValue({
//       ...dummyReturn,
//       user: dummyUser,
//       profile: localpm
//     })

//     render(<User />)
//     await waitFor(() => {
//       expect(screen.getByText('Test User')).toBeVisible()
//     })
//   })
// })

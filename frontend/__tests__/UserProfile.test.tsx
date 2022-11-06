import { render, screen, waitFor } from '@testing-library/react'
import { UserProfile } from '@/Components/User/UserProfile'
import type { ProfileModel } from '@/lib/databaseModels'
import userEvent from '@testing-library/user-event'

jest.mock('@/lib/profileImage')

const dummyProfile: ProfileModel['Row'] = {
  firstname: 'Test',
  lastname: 'User',
  id: 'mytestid',
  avatar_url: null,
  website: null,
  bio: null,
  updated_at: ''
}

const mutateFn = jest.fn()
const SignedInProfile = <UserProfile profile={dummyProfile} mutate={mutateFn} userEmail={'test.user@test.com'} />

describe('UserProfile', () => {
  // it('indicates when not signed in', () => {
  //   setMockImplementations('signed-out')
  //   render(<UserProfile />)
  //   expect(screen.getByText(/not signed in/i)).toBeVisible()
  // })

  // it('indicates when loading profile', () => {
  //   setMockImplementations('loading')
  //   render(<UserProfile />)
  //   expect(screen.getByText(/Loading/i)).toBeVisible()
  // })

  it('contains a prefilled firstname input', async () => {
    render(SignedInProfile)
    await waitFor(async () => {
      expect(
        await screen.findByRole('textbox', { name: /first name/i })
      ).toHaveValue('Test')
    })
  })

  it('contains a prefilled lastname input', async () => {
    render(SignedInProfile)
    await waitFor(async () => {
      expect(
        await screen.findByRole('textbox', { name: /last name/i })
      ).toHaveValue('User')
    })
  })

  it('has a button to update the profile', async () => {
    render(SignedInProfile)
    expect(await screen.findByRole('button', { name: /update/i })).toBeVisible()
  })

  it('has a disabled button when no values changed', async () => {
    render(SignedInProfile)
    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })

  it('has an enabled button when values have been changed', async () => {
    render(SignedInProfile)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })
    await userEvent.clear(firstNameInput)
    await userEvent.type(firstNameInput, 'different first name')
    expect(await screen.findByRole('button', { name: /update/i })).toBeEnabled()
  })

  it('has a disabled button if reverted to saved values', async () => {
    render(SignedInProfile)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })

    await userEvent.clear(firstNameInput)
    await userEvent.type(firstNameInput, 'different first name')
    await userEvent.clear(firstNameInput)
    await userEvent.type(firstNameInput, 'Test')

    await waitFor(async () => {
      expect(
        await screen.findByRole('button', { name: /update/i })
      ).toBeDisabled()
    })
  })

  it('has a disabled button if empty first name', async () => {
    render(SignedInProfile)
    const firstNameInput = await screen.findByRole('textbox', {
      name: /first name/i
    })

    await userEvent.clear(firstNameInput)

    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })

  it('has a disabled button if empty last name', async () => {
    render(SignedInProfile)
    const lastNameInput = await screen.findByRole('textbox', {
      name: /last name/i
    })

    await userEvent.clear(lastNameInput)

    expect(
      await screen.findByRole('button', { name: /update/i })
    ).toBeDisabled()
  })
})

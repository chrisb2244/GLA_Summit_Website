import { render, screen, within } from '@testing-library/react'
import { User } from '@/Components/User'
import { Header } from '@/Components/Header'

describe('User', () => {
  it('is included in the menu', () => {
    const header = render(<Header />).container
    const user = render(<User />).container.innerHTML
    expect(header).toContainHTML(user)
  })

})

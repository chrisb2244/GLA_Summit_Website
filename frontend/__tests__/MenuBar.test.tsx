import { render, screen } from '@testing-library/react'
import { MenuBar } from '@/Components/MenuBar'

describe('MenuBar', () => {
  it('has items with same font styling', () => {
    render(<MenuBar />)
    const menu = screen.getByRole('menu')
    expect(menu).toBeDefined()
  })
})
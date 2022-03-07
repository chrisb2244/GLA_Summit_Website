import { render, screen, within } from '@testing-library/react'
import { MenuBar } from '@/Components/MenuBar'

describe('MenuBar', () => {
  render(<MenuBar />)
  const menu = screen.getByRole('menu')
  it('has the menu role', () => {
    expect(menu).toBeDefined()
  })

  it('has menuitems', () => {
    const items = within(menu).getAllByRole('menuitem')
    expect(items.length).toBeGreaterThan(0)
  })

  it('has items with same font styling', () => {
    const items = within(menu).getAllByRole('menuitem')
    const { areSameFont } = items.reduce((prev: {areSameFont: boolean, font: string | null}, current) => {
      const className = current.className
      return {
        areSameFont: prev.font == null ? ((className === prev.font) && prev.areSameFont) : true,
        font: className
      }
    }, { areSameFont: true, font: null })

    expect(areSameFont).toBe(true)
  })
})

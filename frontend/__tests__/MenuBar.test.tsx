import { render, screen, within } from '@testing-library/react'
import { MenuBar } from '@/Components/MenuBar'

const getLowestLevelStyleInfo = (elem: Element): Array<CSSStyleDeclaration> => {
  const children = elem.children
  if (children) {
    return Array.from(children).flatMap((c) => getLowestLevelStyleInfo(c))
  } else {
    return [window.getComputedStyle(elem)]
  }
}

describe('MenuBar', () => {
  it('has the menu role', () => {
    render(<MenuBar />)
    const menu = screen.getByRole('menu')
    expect(menu).toBeDefined()
  })

  it('has menuitems', () => {
    render(<MenuBar />)
    const menu = screen.getByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items.length).toBeGreaterThan(0)
  })

  it('has items with same font styling', () => {
    render(<MenuBar />)
    const menu = screen.getByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    const { areSameFont } = items.reduce((prev: {areSameFont: boolean, font: string | null}, current) => {
      const className = current.className
      return {
        areSameFont: prev.font ? ((className === prev.font) && prev.areSameFont) : true,
        font: className
      }
    }, {areSameFont: true, font: null})
    
    expect(areSameFont).toBe(true)
  })
})
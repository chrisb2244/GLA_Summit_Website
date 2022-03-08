import { render, within } from '@testing-library/react'
import { Footer } from '@/Components/Footer'

describe('Footer', () => {
  it('has contentinfo role', () => {
    const footer = render(<Footer />)
    expect(footer.getByRole('contentinfo')).toBeDefined()
  })

  it('contains copyright notice', () => {
    const footer = render(<Footer />)
    expect(within(footer.container).getByText(/.*\u00a9.*/)).toBeDefined()
  })

  it('contains social media icons in a grid', () => {
    const footer = render(<Footer />)
    const socialmediaIconGrid = within(footer.container).getByLabelText('Social Media Links')
    expect(socialmediaIconGrid).toHaveAttribute('role', 'grid')
  })

  it('contains social media icons with links', () => {
    const footer = render(<Footer />)
    const socialmediadiv = within(footer.container).getByLabelText('Social Media Links')
    const elems = Array.from(socialmediadiv.children) as HTMLElement[]
    expect(elems.reduce((allLinksSoFar, elem) => {
      return allLinksSoFar && (elem.outerHTML.match(/<a .*href=".*".*>.*<\/a>/) !== null)
    }, true)).toBeTruthy()
  })

  it('contains a contact link', () => {
    const footer = render(<Footer />)
    const contactElem = within(footer.container).getByText(/Contact Us:.*/)
    expect(contactElem).toBeDefined()
    const containsMailToLink = contactElem.outerHTML.match('mailto:contact@glasummit.org')
    expect(containsMailToLink).toBeTruthy()
  })
})

import { PresentationSummary } from '@/Components/PresentationSummary'
import type { Presentation } from '@/Components/PresentationSummary'
import { render, screen } from '@testing-library/react'

const dummyPresentation: Presentation = {
  title: 'Dummy Title, with commas',
  abstract: 'This is the abstract.'
}

describe('PresentationSummary', () => {
  it('contains the title as a heading', () => {
    render(<PresentationSummary presentation={dummyPresentation} />)
    expect(
      screen.getByRole('heading', { name: dummyPresentation.title })
    ).toBeVisible()
  })

  it('contains the abstract', () => {
    render(<PresentationSummary presentation={dummyPresentation} />)
    expect(screen.getByText(dummyPresentation.abstract)).toBeVisible()
  })

  it('has multiple lines if the abstract contains \\r\\n', () => {
    const multilineAbstract = 'This is the abstract.\r\nIt has multiple lines!'
    render(
      <PresentationSummary
        presentation={{ ...dummyPresentation, abstract: multilineAbstract }}
      />
    )
    expect(screen.getByText(dummyPresentation.abstract)).toBeVisible()
  })
})

import { PresentationSummary } from '@/Components/PresentationSummary'
import type { Presentation } from '@/Components/PresentationSummary'
import { render, screen } from '@testing-library/react'

const speaker = 'First Last'
const dummyPresentation: Presentation = {
  title: 'Dummy Title, with commas',
  abstract: 'This is the abstract.',
  speakers: speaker
} as const

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

  it('contains the presenters name if one presenter', () => {
    render(<PresentationSummary presentation={dummyPresentation}/>)
    expect(screen.getByText(speaker)).toBeVisible()
  })

  it('contains the presenters name if one presenter as array', () => {
    render(<PresentationSummary presentation={{...dummyPresentation, speakers: [speaker]}}/>)
    expect(screen.getByText(speaker)).toBeVisible()
  })
  
  it('contains the presenters names multiple presenters', () => {
    render(<PresentationSummary presentation={{...dummyPresentation, speakers: [speaker, 'Other Speaker']}}/>)
    expect(screen.getByText(`${speaker}, Other Speaker`)).toBeVisible()
  })
})

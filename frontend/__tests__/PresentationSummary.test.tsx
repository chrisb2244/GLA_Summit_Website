import { PresentationSummary } from '@/Components/PresentationSummary'
import type { Presentation } from '@/Components/PresentationSummary'
import { render, screen } from '@testing-library/react'

const speakerName = 'First Last'
const speakerObj = {firstname: 'First', lastname: 'Last'}
const dummyPresentation: Presentation = {
  title: 'Dummy Title, with commas',
  abstract: 'This is the abstract.',
  speakers: speakerObj,
  presentationId: 'not-a-presentation-id',
  speakerNames: speakerName,
  scheduledFor: null,
  year: '2021',
  presentationType: 'full length'
} as const

describe('PresentationSummary', () => {
  it('contains the title as a heading', () => {
    render(<PresentationSummary presentation={dummyPresentation} />)
    expect(screen.getByRole('heading', { name: dummyPresentation.title })).toBeVisible()
  })

  it('contains the abstract', () => {
    render(<PresentationSummary presentation={dummyPresentation} />)
    expect(screen.getByText(dummyPresentation.abstract)).toBeVisible()
  })

  it('has multiple lines if the abstract contains \\r\\n', () => {
    const multilineAbstract = 'This is the abstract.\r\nIt has multiple lines!'
    render(<PresentationSummary presentation={{ ...dummyPresentation, abstract: multilineAbstract }}/>)
    expect(screen.getByText(dummyPresentation.abstract)).toBeVisible()
  })

  it('contains the presenters name if one presenter', () => {
    render(<PresentationSummary presentation={dummyPresentation}/>)
    expect(screen.getByText(speakerName)).toBeVisible()
  })

  it('contains the presenters name if one presenter as array', () => {
    render(<PresentationSummary presentation={{...dummyPresentation, speakers: [speakerObj]}}/>)
    expect(screen.getByText(speakerName)).toBeVisible()
  })
  
  it('contains the presenters names multiple presenters', () => {
    render(<PresentationSummary presentation={{...dummyPresentation, speakers: [speakerObj, {firstname: 'Other', lastname: 'Speaker'}], speakerNames: [speakerName, 'Other Speaker']}}/>)
    expect(screen.getByText(`${speakerName}, Other Speaker`)).toBeVisible()
  })

  /*
  // This test might not be possible due to not having full layout engine in these tests
  // Consider testing with Cypress or similar.
  it('truncates extremely long abstracts with ellipses', () => {
    const longAbstract = 'blah blah blah blah'.repeat(500)
    render(<PresentationSummary presentation={{ ...dummyPresentation, abstract: longAbstract }}/>)
    expect(screen.getByText("\u2026")).toBeVisible()
  })
  */
})

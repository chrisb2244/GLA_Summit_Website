import { render, screen, waitFor } from '@testing-library/react'
import { PersonInfo, PresentationReviewInfo, SubmittedPresentationReviewCard } from '@/Components/SubmittedPresentationReviewCard'
import userEvent from '@testing-library/user-event';

describe('SubmittedPresentationReviewCard', () => {
  const submitter: PersonInfo = {
    id: 'myrandomid',
    firstname: 'Test',
    lastname: 'User'
  } 
  const info: PresentationReviewInfo = {
    title: 'Test title',
    abstract: 'Blah blah abstract',
    learning_points: 'Learning points are good',
    presentation_id: 'randomstuffhere',
    presentation_type: 'full length',
    submitter: submitter,
    presenters: [submitter],
    updated_at: ''
  }

  const testObject = <SubmittedPresentationReviewCard presentationInfo={info}/>

  it('renders with title', () => {
    render(testObject)
    expect(screen.getByText('Test title')).toBeVisible()
  })

  it('has a primary action to expand for abstract', async () => {
    render(testObject)
    const title = screen.getByText('Test title')
    const abstractSection = screen.getByText('Blah blah abstract')
    expect(abstractSection).not.toBeVisible()
    await userEvent.click(title)
    expect(abstractSection).toBeVisible()
    await userEvent.click(title)
    return waitFor(() => {
      expect(abstractSection).not.toBeVisible()
    })
  })

  it('contains the primary presenter\'s name', () => {
    render(testObject)
    expect(screen.getByText('Submitter: Test User')).toBeVisible()
  })
})

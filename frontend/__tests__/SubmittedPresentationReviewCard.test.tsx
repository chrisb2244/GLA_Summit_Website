import { render, screen } from '@testing-library/react'
import { SubmittedPresentationReviewCard } from '@/Components/SubmittedPresentationReviewCard'
import { MySubmissionsModel } from '@/lib/databaseModels';

describe('SubmittedPresentationReviewCard', () => {
  const info: MySubmissionsModel = {
    title: 'Test title',
    abstract: 'Blah blah abstract',
    is_submitted: true,
    learning_points: 'Learning points are good',
    presentation_id: 'randomstuffhere',
    submitter_id: 'anotheridhere',
    presentation_type: 'full length',
    all_emails: [],
    all_firstnames: [],
    all_lastnames: [],
    all_presenters_ids: ['anotheridhere']
  }

  it('renders with title', () => {
    render(<SubmittedPresentationReviewCard presentationInfo={info}/>)
    expect(screen.getByText('Test title')).toBeVisible()
  })

  
})

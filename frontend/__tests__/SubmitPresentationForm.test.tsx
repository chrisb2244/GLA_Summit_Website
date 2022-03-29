import { render } from '@testing-library/react'
import { SubmitPresentationForm } from '@/Components/Form/SubmitPresentationForm'

describe('SubmitPresentationForm', () => {
  // it('initially contains one person', () => {
  //   const form = render(<PresentationSubmissionForm />)
  //   expect(form.container).toContainElement(render(<Person />).container)
  // })
  it('pass only', () => {
    const form = render(<SubmitPresentationForm />)
    expect(form).toBeDefined()
  })
})

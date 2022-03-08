import { render, within } from '@testing-library/react'
import { Person } from '@/Components/Form/Person'

describe('Person', () => {
  it('has first and last name text inputs', () => {
    const person = render(<Person />)
    expect(person.getAllByTitle('First Name')).toHaveLength(1)
  })
})

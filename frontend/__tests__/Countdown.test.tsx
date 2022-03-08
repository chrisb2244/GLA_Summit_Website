import { render, within } from '@testing-library/react'
import { Countdown } from '@/Components/Countdown'
import { act } from 'react-dom/test-utils'

describe('Countdown', () => {
  const now = new Date(Date.UTC(2022, 10, 11, 10, 0, 0))
  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(now)
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  const start = new Date(Date.UTC(2022, 10, 15, 12, 0, 0))
  const end = new Date(Date.UTC(2022, 10, 16, 12, 0, 0))

  it('contains 4 subblocks', () => {
    const countdown = render(<Countdown event_start={start} event_end={end} />).container
    act(() => {
      jest.advanceTimersByTime(1200)
    })
    const children = within(countdown).getByTitle('countdown').children
    expect(children.length).toBe(4)
  })

  it('is centered in the container', () => {
    const countdown = render(<Countdown event_start={start} event_end={end} />).container
    const container = countdown.children[0]
    act(() => {
      jest.advanceTimersByTime(1200)
    })
    expect(container).toHaveStyle('display: inline-flex')
  })
})

import { ConfirmationPopup } from "@/Components/ConfirmationPopup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const onCloseFn = jest.fn(() => {})
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onResolveFn = jest.fn((value: boolean) => {})

const EmptyConfPopup = <ConfirmationPopup open setClosed={onCloseFn} onResolve={onResolveFn} />

describe('ConfirmationPopup', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('contains two buttons', () => {
    render(EmptyConfPopup)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('contains the children elements', () => {
    const children = (
      <p>
        Some dummy text...
      </p>
    )
    render(
      <ConfirmationPopup open setClosed={onCloseFn} onResolve={onResolveFn}>
        {children}
      </ConfirmationPopup>
    )
    expect(screen.getByText('Some dummy text...')).toBeVisible()
  })

  it('calls the setClosed function when resolved false', () => {
    render(EmptyConfPopup)
    const cancelButton = screen.getByRole('button', {name: 'Cancel'})
    userEvent.click(cancelButton)
    expect(onCloseFn).toBeCalledTimes(1)
  })

  it('calls the setClosed function when resolved true', () => {
    render(EmptyConfPopup)
    const submitButton = screen.getByRole('button', {name: 'Confirm'})
    userEvent.click(submitButton)
    expect(onCloseFn).toBeCalledTimes(1)
  })

  it('calls the onResolve function with true when confirmed', () => {
    render(EmptyConfPopup)
    const submitButton = screen.getByRole('button', {name: 'Confirm'})
    userEvent.click(submitButton)
    expect(onResolveFn).toHaveBeenCalledWith(true)
  })

  it('calls the onResolve function with false when cancelled', () => {
    render(EmptyConfPopup)
    const cancelButton = screen.getByRole('button', {name: 'Cancel'})
    userEvent.click(cancelButton)
    return expect(onResolveFn).toHaveBeenCalledWith(false)
  })
})

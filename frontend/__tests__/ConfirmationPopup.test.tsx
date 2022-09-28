import { ConfirmationPopup } from "@/Components/ConfirmationPopup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const onCloseFn = jest.fn(() => {})
const onResolveFn = jest.fn((value: boolean) => {})

const EmptyConfPopup = <ConfirmationPopup open setClosed={onCloseFn} onResolve={onResolveFn} />

describe('ConfirmationPopup', () => {
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
})
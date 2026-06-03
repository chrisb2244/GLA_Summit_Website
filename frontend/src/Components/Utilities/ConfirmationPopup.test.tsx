import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationPopup } from './ConfirmationPopup';

const onCloseFn = vi.fn(() => {});
const onResolveFn = vi.fn((_value: boolean) => {});

const EmptyConfPopup = (
  <ConfirmationPopup open setClosed={onCloseFn} onResolve={onResolveFn} />
);

describe('ConfirmationPopup', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('contains two buttons', () => {
    render(EmptyConfPopup);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('contains the children elements', () => {
    const children = <p>Some dummy text...</p>;
    render(
      <ConfirmationPopup open setClosed={onCloseFn} onResolve={onResolveFn}>
        {children}
      </ConfirmationPopup>
    );
    expect(screen.getByText('Some dummy text...')).toBeDefined();
  });

  it('calls the setClosed function when resolved false', async () => {
    render(EmptyConfPopup);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    expect(onCloseFn).toHaveBeenCalledTimes(1);
  });

  it('calls the setClosed function when resolved true', async () => {
    render(EmptyConfPopup);
    const submitButton = screen.getByRole('button', { name: 'Confirm' });
    await userEvent.click(submitButton);
    expect(onCloseFn).toHaveBeenCalledTimes(1);
  });

  it('calls the onResolve function with true when confirmed', async () => {
    render(EmptyConfPopup);
    const submitButton = screen.getByRole('button', { name: 'Confirm' });
    await userEvent.click(submitButton);
    expect(onResolveFn).toHaveBeenCalledWith(true);
  });

  it('calls the onResolve function with false when cancelled', async () => {
    render(EmptyConfPopup);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    expect(onResolveFn).toHaveBeenCalledWith(false);
  });
});

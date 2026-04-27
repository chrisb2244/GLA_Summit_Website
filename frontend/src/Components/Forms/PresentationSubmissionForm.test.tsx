import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PresentationSubmissionForm } from './PresentationSubmissionForm';
import { submitNewPresentation } from '@/actions/presentationSubmission';

vi.mock('@/actions/presentationSubmission', () => ({
  submitNewPresentation: vi.fn()
}));

const mockSubmitNewPresentation = vi.mocked(submitNewPresentation);

const submitter = {
  firstName: 'Test',
  lastName: 'Submitter',
  email: 'submitter@example.com'
};

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText('Title'), 'Regression Test Title');
  await userEvent.type(
    screen.getByLabelText('Abstract'),
    'A reliable abstract '.repeat(12)
  );
  await userEvent.type(
    screen.getByLabelText('Learning Points'),
    'A reliable learning point '.repeat(4)
  );
  await userEvent.click(
    screen.getByLabelText(/I agree to the GLA Summit speaker agreement/i)
  );
};

describe('PresentationSubmissionForm state retention', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('resets only on successful action response', async () => {
    mockSubmitNewPresentation.mockResolvedValueOnce({ success: true });

    render(<PresentationSubmissionForm submitter={submitter} />);
    await fillValidForm();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Presentation', exact: true })
    );

    await waitFor(() => {
      expect(screen.getByText('Presentation submitted successfully!')).toBeTruthy();
    });
    expect(screen.queryByLabelText('Title')).toBeNull();
  });

  it('retains form values when action reports duplicate', async () => {
    mockSubmitNewPresentation.mockResolvedValueOnce({
      success: false,
      isDuplicate: true,
      existingId: 'abc123',
      existingTitle: 'Regression Test Title'
    });

    render(<PresentationSubmissionForm submitter={submitter} />);
    await fillValidForm();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Presentation', exact: true })
    );

    await waitFor(() => {
      expect(screen.getByText('Possible duplicate')).toBeTruthy();
    });

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Regression Test Title'
    );
    expect((screen.getByLabelText('Abstract') as HTMLTextAreaElement).value).toBe(
      'A reliable abstract '.repeat(12)
    );
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('A reliable learning point '.repeat(4));
    expect(
      screen.getByRole('button', { name: 'Submit Anyway', exact: true })
    ).toBeTruthy();
  });

  it('retains form values when action returns an error', async () => {
    mockSubmitNewPresentation.mockResolvedValueOnce({
      success: false,
      error: { message: 'Something went wrong' }
    });

    render(<PresentationSubmissionForm submitter={submitter} />);
    await fillValidForm();

    await userEvent.click(
      screen.getByRole('button', { name: 'Submit Presentation', exact: true })
    );

    await waitFor(() => {
      expect(mockSubmitNewPresentation).toHaveBeenCalledTimes(1);
    });

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Regression Test Title'
    );
    expect((screen.getByLabelText('Abstract') as HTMLTextAreaElement).value).toBe(
      'A reliable abstract '.repeat(12)
    );
    expect(
      (screen.getByLabelText('Learning Points') as HTMLTextAreaElement).value
    ).toBe('A reliable learning point '.repeat(4));
    expect(
      screen.queryByText('Presentation submitted successfully!')
    ).toBeNull();
  });
});

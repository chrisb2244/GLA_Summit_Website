import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftEditForm } from './DraftEditForm';
import type { PresentationBaseFormData } from '@/Components/Forms/PresentationFormShared';
import {
  updateDraftPresentation,
  submitFinalDraftPresentation,
  deleteDraftPresentation
} from '@/actions/presentationSubmission';

// Mock server actions
vi.mock('@/actions/presentationSubmission', () => ({
  updateDraftPresentation: vi.fn().mockResolvedValue({ success: true }),
  submitFinalDraftPresentation: vi.fn().mockResolvedValue({ success: true }),
  deleteDraftPresentation: vi.fn().mockResolvedValue({ success: true })
}));

// Suppress JSDOM window.location navigation errors
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '' }
});

const submitter = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com'
};

const defaultValues: PresentationBaseFormData = {
  submitter,
  title: 'Existing Draft Title',
  abstract: 'A'.repeat(150),
  learningPoints: 'Key things to learn from this session. '.repeat(3),
  presentationType: 'full length',
  isFinal: false,
  speakerAgreement: false,
  otherPresenters: []
};

describe('DraftEditForm', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the pre-filled title', () => {
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    const titleInput = screen.getByDisplayValue('Existing Draft Title');
    expect(titleInput).toBeDefined();
  });

  it('renders Save Draft and Delete Draft buttons', () => {
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    expect(
      screen.getByRole('button', { name: /save draft/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /delete draft/i })
    ).toBeDefined();
  });

  it('calls updateDraftPresentation without isFinal on Save Draft', async () => {
    const mockedUpdate = vi.mocked(updateDraftPresentation);
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalled();
      const formData: FormData = mockedUpdate.mock.calls[0][0];
      expect(formData.get('presentationId')).toBe('pres-id-1');
      // isFinal should be absent/empty for draft save
      expect(formData.get('isFinal')).toBeFalsy();
    });
  });

  it('shows success state after Save Draft', async () => {
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(screen.getByText('Draft saved successfully!')).toBeDefined();
    });
  });

  it('does not call updateDraftPresentation on Submit Presentation without speaker agreement', async () => {
    const mockedUpdate = vi.mocked(updateDraftPresentation);
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: /submit presentation/i })
    );

    await waitFor(() => {
      expect(mockedUpdate).not.toHaveBeenCalled();
    });
  });

  it('calls updateDraftPresentation with isFinal on Submit Presentation', async () => {
    const mockedUpdate = vi.mocked(updateDraftPresentation);
    const mockedSubmitFinal = vi.mocked(submitFinalDraftPresentation);
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );

    const agreementCheckbox = screen.getByRole('checkbox', {
      name: /speaker agreement/i
    }) as HTMLInputElement;
    await userEvent.click(agreementCheckbox);
    expect(agreementCheckbox.checked).toBe(true);
    await userEvent.click(
      screen.getByRole('button', { name: /submit presentation/i })
    );

    await waitFor(() => {
      expect(
        mockedUpdate.mock.calls.length + mockedSubmitFinal.mock.calls.length
      ).toBeGreaterThan(0);

      const formData: FormData = mockedUpdate.mock.calls.length
        ? mockedUpdate.mock.calls[0][0]
        : mockedSubmitFinal.mock.calls[0][0];
      expect(formData.get('presentationId')).toBe('pres-id-1');
      // The JS path sets isFinal in the client; the no-JS formAction wrapper
      // sets it on the server action side.
      if (mockedUpdate.mock.calls.length) {
        expect(formData.get('isFinal')).toBe('on');
      }
    });
  });

  it('shows "Keep editing" button in success state', async () => {
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /keep editing/i })).toBeDefined()
    );
    await userEvent.click(screen.getByRole('button', { name: /keep editing/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeDefined();
    });
  });

  it('opens delete confirmation dialog', async () => {
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete draft/i })
    );
    await waitFor(() => {
      expect(screen.getByText('Delete this draft?')).toBeDefined();
    });
  });

  it('calls deleteDraftPresentation when delete is confirmed', async () => {
    const mockedDelete = vi.mocked(deleteDraftPresentation);
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete draft/i })
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeDefined()
    );
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(mockedDelete).toHaveBeenCalledWith('pres-id-1');
    });
  });

  it('shows error message when save fails', async () => {
    const mockedUpdate = vi.mocked(updateDraftPresentation);
    mockedUpdate.mockResolvedValueOnce({
      success: false,
      error: { message: 'Database error' }
    });
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText('Database error')).toBeDefined();
    });
  });
});

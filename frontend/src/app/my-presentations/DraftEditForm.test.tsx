import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftEditForm } from './DraftEditForm';
import type { PresentationBaseFormData } from '@/Components/Forms/PresentationFormShared';

// Mock server actions
vi.mock('@/actions/presentationSubmission', () => ({
  updateDraftPresentation: vi.fn().mockResolvedValue({ success: true }),
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
  learningPoints: 'Key things to learn',
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
    const { updateDraftPresentation } = await import(
      '@/actions/presentationSubmission'
    );
    render(
      <DraftEditForm
        presentationId='pres-id-1'
        submitter={submitter}
        defaultValues={defaultValues}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));
    await waitFor(() => {
      expect(updateDraftPresentation).toHaveBeenCalled();
      const formData: FormData = (updateDraftPresentation as ReturnType<typeof vi.fn>).mock.calls[0][0];
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
    const { deleteDraftPresentation } = await import(
      '@/actions/presentationSubmission'
    );
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
      expect(deleteDraftPresentation).toHaveBeenCalledWith('pres-id-1');
    });
  });

  it('shows error message when save fails', async () => {
    const { updateDraftPresentation } = await import(
      '@/actions/presentationSubmission'
    );
    (updateDraftPresentation as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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

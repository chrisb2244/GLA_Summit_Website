import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraftPresentationCard } from './DraftPresentationCard';
import type { MyPresentationSubmissionType } from '@/lib/databaseModels';

// Mock the server action so we don't need a real Supabase connection
vi.mock('@/actions/presentationSubmission', () => ({
  deleteDraftPresentation: vi.fn().mockResolvedValue({ success: true })
}));

const mockDraft: MyPresentationSubmissionType = {
  presentation_id: 'draft-id-1',
  title: 'My Draft Presentation',
  abstract: 'Draft abstract',
  learning_points: 'Some learning points',
  presentation_type: 'full length',
  submitter_id: 'user-1',
  is_submitted: false,
  year: '2025',
  updated_at: '2025-03-01T12:00:00Z',
  all_emails: ['alice@example.com'],
  all_firstnames: ['Alice'],
  all_lastnames: ['Smith'],
  all_presenters_ids: ['user-1']
};

describe('DraftPresentationCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the draft title', () => {
    render(<DraftPresentationCard draft={mockDraft} />);
    expect(screen.getByText('My Draft Presentation')).toBeDefined();
  });

  it('renders the presentation type', () => {
    render(<DraftPresentationCard draft={mockDraft} />);
    expect(screen.getByText('(full length)')).toBeDefined();
  });

  it('shows a Delete Draft button', () => {
    render(<DraftPresentationCard draft={mockDraft} />);
    expect(screen.getByRole('button', { name: /delete draft/i })).toBeDefined();
  });

  it('opens confirmation dialog when Delete Draft is clicked', async () => {
    render(<DraftPresentationCard draft={mockDraft} />);
    await userEvent.click(screen.getByRole('button', { name: /delete draft/i }));
    await waitFor(() => {
      expect(screen.getByText('Delete this draft?')).toBeDefined();
    });
  });

  it('closes the dialog when Cancel is clicked', async () => {
    render(<DraftPresentationCard draft={mockDraft} />);
    await userEvent.click(screen.getByRole('button', { name: /delete draft/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDefined()
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText('Delete this draft?')).toBeNull();
    });
  });

  it('calls deleteDraftPresentation when confirmed', async () => {
    const { deleteDraftPresentation } = await import(
      '@/actions/presentationSubmission'
    );
    render(<DraftPresentationCard draft={mockDraft} />);
    await userEvent.click(screen.getByRole('button', { name: /delete draft/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^delete$/i })).toBeDefined()
    );
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(deleteDraftPresentation).toHaveBeenCalledWith('draft-id-1');
    });
  });
});

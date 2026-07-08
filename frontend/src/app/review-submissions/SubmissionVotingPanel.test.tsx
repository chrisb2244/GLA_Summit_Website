import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmissionVotingPanel } from './SubmissionVotingPanel';

vi.mock('./actions', () => ({ castVote: vi.fn().mockResolvedValue({ success: true }) }));
// Keep the feature flag on for these tests regardless of config default.
vi.mock('@/app/configConstants', () => ({ ORGANIZER_VOTING: true }));

import { castVote } from './actions';

const organizers = [
  { id: 'org-1', firstname: 'Ada', lastname: 'Lovelace' },
  { id: 'org-2', firstname: 'Alan', lastname: 'Turing' },
  { id: 'org-3', firstname: 'Grace', lastname: 'Hopper' }
];

describe('SubmissionVotingPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderPanel = (
    overrides: Partial<React.ComponentProps<typeof SubmissionVotingPanel>> = {}
  ) =>
    render(
      <SubmissionVotingPanel
        presentationId='pres-1'
        currentUserId='org-1'
        organizers={organizers}
        votes={[{ organizer_id: 'org-2', vote: 'for' }]}
        status='under-review'
        {...overrides}
      />
    );

  it('lists every organizer with their vote, incl. "Not voted"', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /Vote record/ }));

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    // org-2 voted 'for'; org-1 (you) and org-3 have not voted.
    expect(within(items[1]).getByText('For')).toBeDefined();
    expect(screen.getAllByText('Not voted')).toHaveLength(2);
  });

  it('shows the vote count in the record toggle', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Vote record (1/3)' })).toBeDefined();
  });

  it('shows voting buttons under review and casts a vote', async () => {
    renderPanel();
    const forBtn = screen.getByRole('button', { name: 'For' });
    await userEvent.click(forBtn);
    expect(castVote).toHaveBeenCalledWith('pres-1', 'for');
  });

  it('clears the vote when clicking the active choice', async () => {
    renderPanel({
      votes: [{ organizer_id: 'org-1', vote: 'against' }]
    });
    await userEvent.click(screen.getByRole('button', { name: 'Against' }));
    expect(castVote).toHaveBeenCalledWith('pres-1', null);
  });

  it('hides voting buttons once the submission has an outcome', () => {
    renderPanel({ status: 'accepted' });
    expect(screen.queryByRole('button', { name: 'For' })).toBeNull();
    // The record is still expandable.
    expect(screen.getByRole('button', { name: /Vote record/ })).toBeDefined();
  });

  it('hides voting buttons for a non-organizer viewer', () => {
    renderPanel({ currentUserId: 'someone-else' });
    expect(screen.queryByRole('button', { name: 'For' })).toBeNull();
  });
});

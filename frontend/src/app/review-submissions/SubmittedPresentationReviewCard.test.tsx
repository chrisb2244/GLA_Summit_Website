import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import {
  PersonInfo,
  PresentationReviewInfo,
  SubmittedPresentationReviewCard
} from './SubmittedPresentationReviewCard';
import userEvent from '@testing-library/user-event';

describe('SubmittedPresentationReviewCard', () => {
  afterEach(() => {
    cleanup();
  });

  const submitter: PersonInfo = {
    id: 'myrandomid',
    firstname: 'Test',
    lastname: 'User'
  };
  const info: PresentationReviewInfo = {
    title: 'Test title',
    abstract: 'Blah blah abstract',
    learning_points: 'Learning points are good',
    presentation_id: 'randomstuffhere',
    presentation_type: 'full length',
    submitter: submitter,
    presenters: [submitter],
    updated_at: ''
  };

  const testObject = (
    <SubmittedPresentationReviewCard presentationInfo={info} />
  );

  it('renders with title', () => {
    render(testObject);
    expect(screen.getByText('Test title')).toBeDefined();
  });

  it('has a primary action to expand for abstract', async () => {
    render(testObject);
    const title = screen.getByText('Test title');
    const abstractSection = screen.queryByText('Blah blah abstract');
    expect(abstractSection).toBeNull();
    await userEvent.click(title);
    waitFor(() => {
      expect(abstractSection).toBeDefined();
    });
    await userEvent.click(title);
    return waitFor(() => {
      expect(abstractSection).toBeNull();
    });
  });

  it("contains the primary presenter's name", () => {
    render(testObject);
    expect(screen.getByText(/Submitter: Test User/)).toBeDefined();
  });

  it('displays the intended duration', () => {
    render(testObject);
    expect(screen.getByText(/(45 minutes)/)).toBeDefined();
  });
});

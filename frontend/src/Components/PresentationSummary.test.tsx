import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PresentationSummary } from './PresentationSummary';
import type { Presentation } from './PresentationSummary';

afterEach(cleanup);

const mockPresentation: Presentation = {
  title: 'Sample Presentation',
  abstract: 'This is a sample abstract for the presentation.',
  speakers: [
    { firstname: 'Tom', lastname: 'Smith' },
    { firstname: '', lastname: '' }
  ],
  speakerNames: ['Tom Smith', ''],
  presentationId: '123',
  year: '2024',
  scheduledFor: '2023-10-10T10:00:00Z',
  presentationType: 'full length'
};

describe('PresentationSummary', () => {
  it('renders the title as a link to the presentation', () => {
    render(<PresentationSummary presentation={mockPresentation} />);
    expect(
      screen.getByRole('link', { name: mockPresentation.title })
    ).toBeDefined();
  });

  it('renders the abstract', () => {
    render(<PresentationSummary presentation={mockPresentation} />);
    expect(screen.getByText(mockPresentation.abstract)).toBeDefined();
  });

  it('renders a multi-line abstract as separate paragraphs', () => {
    render(
      <PresentationSummary
        presentation={{
          ...mockPresentation,
          abstract: 'First line of the abstract.\r\nSecond line of the abstract.'
        }}
      />
    );
    expect(screen.getByText('First line of the abstract.')).toBeDefined();
    expect(screen.getByText('Second line of the abstract.')).toBeDefined();
  });

  it('renders a single presenter passed as a string', () => {
    render(
      <PresentationSummary
        presentation={{
          ...mockPresentation,
          speakers: { firstname: 'Solo', lastname: 'Speaker' },
          speakerNames: 'Solo Speaker'
        }}
      />
    );
    expect(screen.getByText('Solo Speaker')).toBeDefined();
  });

  it('renders a single presenter passed as an array', () => {
    render(
      <PresentationSummary
        presentation={{
          ...mockPresentation,
          speakers: [{ firstname: 'Solo', lastname: 'Speaker' }],
          speakerNames: ['Solo Speaker']
        }}
      />
    );
    expect(screen.getByText('Solo Speaker')).toBeDefined();
  });

  it('renders multiple presenters joined with commas', () => {
    render(
      <PresentationSummary
        presentation={{
          ...mockPresentation,
          speakers: [
            { firstname: 'Tom', lastname: 'Smith' },
            { firstname: 'Jane', lastname: 'Smith' }
          ],
          speakerNames: ['Tom Smith', 'Jane Smith']
        }}
      />
    );
    expect(screen.getByText('Tom Smith, Jane Smith')).toBeDefined();
  });

  it('renders only the defined presenter name when another presenter is blank', () => {
    render(<PresentationSummary presentation={mockPresentation} />);
    expect(screen.getByText('Tom Smith', { exact: true })).toBeDefined();
  });

  it('renders only the defined presenter name when the blank presenter is first', () => {
    render(
      <PresentationSummary
        presentation={{
          ...mockPresentation,
          speakers: [
            { firstname: '', lastname: '' },
            { firstname: 'Jane', lastname: 'Smith' }
          ],
          speakerNames: ['', 'Jane Smith']
        }}
      />
    );
    expect(screen.getByText('Jane Smith', { exact: true })).toBeDefined();
  });
});

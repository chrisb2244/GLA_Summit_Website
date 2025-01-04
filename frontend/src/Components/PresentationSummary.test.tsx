import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresentationSummary } from './PresentationSummary';
import type { Presentation } from './PresentationSummary';

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

test('renders only defined presenter names when one of the presenters has a blank first and last name', () => {
  render(<PresentationSummary presentation={mockPresentation} />);
  const speakerElement = screen.getByText('Tom Smith', { exact: true });
  expect(speakerElement).toBeDefined();
});

test('renders only defined presenter names when one of the presenters has a blank first and last name (reordered)', () => {
  const mockPresentation2 = {
    ...mockPresentation,
    speakers: [
      { firstname: '', lastname: '' },
      { firstname: 'Jane', lastname: 'Smith' }
    ],
    speakerNames: ['', 'Jane Smith']
  };
  render(<PresentationSummary presentation={mockPresentation2} />);
  const speakerElement = screen.getByText('Jane Smith', { exact: true });
  expect(speakerElement).toBeDefined();
});

import { describe, expect, it } from 'vitest';
import { mapSubmittedPresentations } from './page';

describe('mapSubmittedPresentations', () => {
  it('filters out draft rows when rpc payload includes is_submitted=false', () => {
    const rows = [
      {
        presentation_id: 'submitted-1',
        title: 'Submitted talk',
        abstract: 'Abstract A',
        presentation_type: 'full length' as const,
        learning_points: 'Points A',
        submitter_id: 'u-1',
        presenters: [
          {
            id: 'u-1',
            firstname: 'Alice',
            lastname: 'Smith'
          }
        ],
        updated_at: '2026-05-15T00:00:00Z',
        is_submitted: true
      },
      {
        presentation_id: 'draft-1',
        title: 'Draft talk',
        abstract: 'Abstract B',
        presentation_type: '15 minutes' as const,
        learning_points: 'Points B',
        submitter_id: 'u-2',
        presenters: [
          {
            id: 'u-2',
            firstname: 'Bob',
            lastname: 'Jones'
          }
        ],
        updated_at: '2026-05-15T00:00:00Z',
        is_submitted: false
      }
    ];

    const result = mapSubmittedPresentations(rows, false);

    expect(result).toHaveLength(1);
    expect(result[0].presentation_id).toBe('submitted-1');
    expect(result[0].title).toBe('Submitted talk');
  });

  it('returns empty list when rpc returns an error', () => {
    const rows = [
      {
        presentation_id: 'submitted-1',
        title: 'Submitted talk',
        abstract: 'Abstract A',
        presentation_type: 'full length' as const,
        learning_points: 'Points A',
        submitter_id: 'u-1',
        presenters: [
          {
            id: 'u-1',
            firstname: 'Alice',
            lastname: 'Smith'
          }
        ],
        updated_at: '2026-05-15T00:00:00Z',
        is_submitted: true
      }
    ];

    const result = mapSubmittedPresentations(rows, true);

    expect(result).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { bucketSubmissions, mapSubmittedPresentations } from './page';
import type { PresentationReviewInfo } from './SubmittedPresentationReviewCard';

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

describe('bucketSubmissions', () => {
  const makeSubmission = (
    id: string,
    updatedAt: string
  ): PresentationReviewInfo => ({
    title: `Talk ${id}`,
    abstract: 'Abstract',
    submitter: { id: 'u', firstname: 'A', lastname: 'B' },
    presenters: [{ id: 'u', firstname: 'A', lastname: 'B' }],
    learning_points: '',
    presentation_id: id,
    presentation_type: 'full length',
    updated_at: updatedAt
  });

  it('partitions submissions by outcome membership', () => {
    const submissions = [
      makeSubmission('a', '2026-05-01T00:00:00Z'),
      makeSubmission('b', '2026-05-02T00:00:00Z'),
      makeSubmission('c', '2026-05-03T00:00:00Z')
    ];

    const result = bucketSubmissions(
      submissions,
      new Set(['b']),
      new Set(['c'])
    );

    expect(result.accepted.map((s) => s.presentation_id)).toEqual(['b']);
    expect(result.declined.map((s) => s.presentation_id)).toEqual(['c']);
    expect(result['under-review'].map((s) => s.presentation_id)).toEqual(['a']);
  });

  it('sorts each bucket by most recently updated first', () => {
    const submissions = [
      makeSubmission('old', '2026-05-01T00:00:00Z'),
      makeSubmission('new', '2026-05-10T00:00:00Z'),
      makeSubmission('mid', '2026-05-05T00:00:00Z')
    ];

    const result = bucketSubmissions(submissions, new Set(), new Set());

    expect(result['under-review'].map((s) => s.presentation_id)).toEqual([
      'new',
      'mid',
      'old'
    ]);
  });

  it('treats acceptance as taking precedence over decline for the same id', () => {
    const submissions = [makeSubmission('a', '2026-05-01T00:00:00Z')];
    const result = bucketSubmissions(
      submissions,
      new Set(['a']),
      new Set(['a'])
    );
    expect(result.accepted.map((s) => s.presentation_id)).toEqual(['a']);
    expect(result.declined).toEqual([]);
  });
});

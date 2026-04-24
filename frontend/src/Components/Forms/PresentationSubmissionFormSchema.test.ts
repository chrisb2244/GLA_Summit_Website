import { describe, it, expect } from 'vitest';
import { PresentationSubmissionFormSchema } from './PresentationSubmissionFormSchema';

const baseValidInput = {
  'submitter.firstName': 'Alice',
  'submitter.lastName': 'Smith',
  'submitter.email': 'alice@example.com',
  isFinal: 'on',
  speakerAgreement: 'on',
  title: 'My Presentation',
  abstract: 'A'.repeat(150),
  learningPoints: 'Key points',
  presentationType: 'full length'
};

describe('PresentationSubmissionFormSchema', () => {
  it('parses a valid submission', () => {
    const result = PresentationSubmissionFormSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Presentation');
      expect(result.data.isFinal).toBe(true);
      expect(result.data.speakerAgreement).toBe(true);
      expect(result.data.skipDuplicateCheck).toBe(false);
      expect(result.data.otherPresenters).toEqual([]);
    }
  });

  it('treats missing isFinal as false (draft save)', () => {
    const input = { ...baseValidInput };
    const { isFinal: _, ...withoutIsFinal } = input;
    const result = PresentationSubmissionFormSchema.safeParse(withoutIsFinal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFinal).toBe(false);
    }
  });

  it('treats missing speakerAgreement as false', () => {
    const input = { ...baseValidInput };
    const { speakerAgreement: _, ...withoutAgreement } = input;
    const result =
      PresentationSubmissionFormSchema.safeParse(withoutAgreement);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.speakerAgreement).toBe(false);
    }
  });

  it('parses skipDuplicateCheck=true when present', () => {
    const input = { ...baseValidInput, skipDuplicateCheck: 'true' };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skipDuplicateCheck).toBe(true);
    }
  });

  it('collects co-presenter emails from indexed keys', () => {
    const input = {
      ...baseValidInput,
      'otherPresenters.0.email': 'bob@example.com',
      'otherPresenters.1.email': 'carol@example.com'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.otherPresenters).toEqual([
        'bob@example.com',
        'carol@example.com'
      ]);
    }
  });

  it('fails when a co-presenter email is invalid', () => {
    const input = {
      ...baseValidInput,
      'otherPresenters.0.email': 'not-an-email'
    };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('fails for an unknown (non-email) extra key', () => {
    const input = { ...baseValidInput, unexpectedField: 'not-an-email' };
    const result = PresentationSubmissionFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
